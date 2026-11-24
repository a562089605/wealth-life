const maxSlots = 100;
const maxSaveBytes = 1024 * 1024;
const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
const validCode = code => typeof code === 'string' && code.length >= 8 && code.length <= 72 && code === code.trim();

const normalizeName = value => typeof value === 'string' ? value.normalize('NFKC').trim().toLowerCase() : '';
const validName = name => /^[\p{L}\p{N}_-]{2,24}$/u.test(name);
const accountFor = (env, name) => env.PLAYER_SAVES.get(env.PLAYER_SAVES.idFromName(name));

async function passwordHash(code, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(code), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:encoder.encode(salt), iterations:100000}, key, 256));
}
async function newSecret(code) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return 'pbkdf2:'+salt+':'+await passwordHash(code,salt);
}
async function matchesSecret(secret,code) {
  if (!secret) return false;
  const [version,salt,digest] = secret.split(':');
  const expected = version==='pbkdf2'?digest:secret;
  const actual = version==='pbkdf2'?await passwordHash(code,salt):
    hex(await crypto.subtle.digest('SHA-256',encoder.encode(code.toLowerCase())));
  let difference = actual.length ^ expected.length;
  for(let i=0;i<expected.length;i++) difference |= expected.charCodeAt(i)^actual.charCodeAt(i);
  return difference===0;
}
const respond = (data, status = 200) => Response.json(data, {
  status, headers: { 'Cache-Control': 'no-store' }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/private-save') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return respond({ error: 'method' }, 405);
    if (request.headers.get('Origin') !== url.origin) return respond({ error: 'origin' }, 403);
    const declared = Number(request.headers.get('Content-Length'));
    if (declared > maxSaveBytes + 8192) return respond({ error: 'size' }, 413);
    let body;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > maxSaveBytes + 8192) return respond({ error: 'size' }, 413);
      body = JSON.parse(raw);
    } catch {
      return respond({ error: 'input' }, 400);
    }
    if (!body || typeof body.name !== 'string' || typeof body.code !== 'string') return respond({ error: 'input' }, 400);
    const name = normalizeName(body.name);
    if (!validName(name) || !validCode(body.code)) return respond({ error: 'input' }, 400);
    const forward = accountKey => accountFor(env, accountKey).fetch(url.origin + '/internal', {
      method: 'POST', body: JSON.stringify({ ...body, name, accountKey })
    });
    const response = await forward(name);
    if (response.status !== 307) return response;
    const { accountKey } = await response.json();
    const result = await forward(accountKey);
    return result.status === 307 ? respond({ error: 'network' }, 503) : result;
  }
};

export class PlayerSaves {
  constructor(ctx, env) {
    this.env = env;
    this.renaming = false;
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS save_generation (id INTEGER PRIMARY KEY CHECK(id=1), generation INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS account (id INTEGER PRIMARY KEY CHECK(id = 1), secret TEXT NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS login_name (id INTEGER PRIMARY KEY CHECK(id=1), name TEXT NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS login_alias (id INTEGER PRIMARY KEY CHECK(id=1), account_key TEXT NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY CHECK(id = 1), started INTEGER NOT NULL, failures INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS saves (slot INTEGER PRIMARY KEY, revision INTEGER NOT NULL, data TEXT)');
  }

  async fetch(request) {
    const { action, code, newCode, newName, name, accountKey, slot, revision, data, generation } = await request.json();
    const lookup = () => this.sql.exec('SELECT secret FROM account WHERE id = 1').toArray()[0]?.secret;
    const alias = () => this.sql.exec('SELECT account_key FROM login_alias WHERE id=1').toArray()[0]?.account_key;
    const loginName = () => this.sql.exec('SELECT name FROM login_name WHERE id=1').toArray()[0]?.name ?? accountKey;
    if (new URL(request.url).pathname === '/internal/reserve-alias') {
      const owner = alias();
      if (lookup() || (owner && owner !== accountKey)) return respond({error:'taken'},409);
      this.sql.exec('INSERT OR IGNORE INTO login_alias VALUES (1, ?)', accountKey);
      return respond({reserved:true});
    }
    if (alias()) return respond({accountKey:alias()},307);
    if (name !== loginName()) return action === 'create' ? respond({error:'taken'},409) : respond({error:'credentials'},401);
    const currentGeneration = this.sql.exec('SELECT generation FROM save_generation WHERE id=1').toArray()[0]?.generation ?? 0;
    let secret = lookup();
    const now = Date.now(), windowMs = 60000;
    const attempts = this.sql.exec('SELECT started, failures FROM attempts WHERE id = 1').toArray()[0];
    if (attempts && now - attempts.started < windowMs && attempts.failures >= 6) return respond({error:'rate'},429);
    if (action === 'create' && !secret) {
      const candidate = await newSecret(code);
      if (alias()) return respond({error:'taken'},409);
      this.sql.exec('INSERT OR IGNORE INTO account (id, secret) VALUES (1, ?)', candidate);
      secret = lookup();
      if (secret === candidate) return respond({slots:[],generation:currentGeneration,accountKey});
    }
    if (!await matchesSecret(secret,code) || secret !== lookup()) {
      this.sql.exec(`INSERT INTO attempts (id,started,failures) VALUES (1,?,1)
        ON CONFLICT(id) DO UPDATE SET failures=CASE WHEN excluded.started-attempts.started>=60000 THEN 1 ELSE attempts.failures+1 END,
        started=CASE WHEN excluded.started-attempts.started>=60000 THEN excluded.started ELSE attempts.started END`,now);
      return action==='create'?respond({error:'taken'},409):respond({error:'credentials'},401);
    }
    if (name !== loginName()) return respond({error:'credentials'},401);
    if (attempts) this.sql.exec('DELETE FROM attempts WHERE id = 1');
    if (action === 'change-name') {
      const next = normalizeName(newName);
      if (!validName(next) || next === name) return respond({error:'input'},400);
      if ((generation??0) !== currentGeneration) return respond({error:'credentials'},401);
      if (this.renaming) return respond({error:'busy'},409);
      this.renaming = true;
      try {
        // Only the login name changes. This object's saves and their revisions stay in place.
        if (next !== accountKey) {
          const reserve = await accountFor(this.env, next).fetch(new URL('/internal/reserve-alias',request.url), {
            method:'POST', body:JSON.stringify({accountKey})
          });
          if (reserve.status === 409) return respond({error:'taken'},409);
          if (!reserve.ok) return respond({error:'network'},503);
        }
        if (secret !== lookup() || name !== loginName()) return respond({error:'credentials'},401);
        this.sql.exec('INSERT INTO login_name VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name', next);
        return respond({changed:true,name:next});
      } finally {
        this.renaming = false;
      }
    }
    if (action === 'change-code') {
      if (this.renaming) return respond({error:'busy'},409);
      if (!validCode(newCode) || code === newCode) return respond({error:'input'},400);
      const replacement = await newSecret(newCode);
      if (secret !== lookup() || name !== loginName() || this.renaming) return respond({error:'credentials'},401);
      this.sql.exec('UPDATE account SET secret=? WHERE id=1',replacement);
      return respond({changed:true});
    }
    if (action === 'create' || action === 'read') return respond({ generation:currentGeneration, accountKey, slots: this.sql.exec('SELECT slot, revision, data FROM saves ORDER BY slot').toArray() });
    if (action === 'write' && (generation??0)!==currentGeneration) return respond({error:'credentials'},401);
    if (action !== 'write' || !Number.isInteger(slot) || slot < 1 || slot > maxSlots ||
        !Number.isSafeInteger(revision) || revision < 0 || (data !== null && typeof data !== 'string')) {
      return respond({ error: 'input' }, 400);
    }
    if (data !== null) {
      if (new TextEncoder().encode(data).length > maxSaveBytes) return respond({ error: 'size' }, 413);
      try {
        const record = JSON.parse(data);
        if (!record || typeof record !== 'object' || !Number.isInteger(record.month) || !Number.isFinite(record.cash)) throw Error();
      } catch {
        return respond({ error: 'input' }, 400);
      }
    }
    const current = this.sql.exec('SELECT revision, data FROM saves WHERE slot = ?', slot).toArray()[0];
    const actual = current?.revision ?? 0;
    if (actual !== revision && current?.data !== data) return respond({ error: 'conflict', current }, 409);
    if (current && current.data === data) return respond({ revision: actual });
    this.sql.exec('INSERT INTO saves (slot, revision, data) VALUES (?, ?, ?) ON CONFLICT(slot) DO UPDATE SET revision = excluded.revision, data = excluded.data', slot, actual + 1, data);
    return respond({ revision: actual + 1 });
  }
}
