const maxSlots = 100;
const maxSaveBytes = 1024 * 1024;
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
    const name = body.name.normalize('NFKC').trim().toLowerCase();
    if (!/^[\p{L}\p{N}_-]{2,24}$/u.test(name) || !/^[0-9a-f]{32}$/.test(body.code)) return respond({ error: 'input' }, 400);
    return env.PLAYER_SAVES.get(env.PLAYER_SAVES.idFromName(name)).fetch(new Request(url.origin + '/internal', {
      method: 'POST', body: JSON.stringify({ ...body, name })
    }));
  }
};

export class PlayerSaves {
  constructor(ctx) {
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS account (id INTEGER PRIMARY KEY CHECK(id = 1), secret TEXT NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS saves (slot INTEGER PRIMARY KEY, revision INTEGER NOT NULL, data TEXT)');
  }

  async fetch(request) {
    const { action, code, slot, revision, data } = await request.json();
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
    const secret = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
    const account = this.sql.exec('SELECT secret FROM account WHERE id = 1').toArray()[0];
    if (action === 'create') {
      if (account && account.secret !== secret) return respond({ error: 'taken' }, 409);
      if (!account) this.sql.exec('INSERT INTO account (id, secret) VALUES (1, ?)', secret);
      return respond({ slots: [] });
    }
    if (!account || account.secret !== secret) return respond({ error: 'credentials' }, 401);
    if (action === 'read') return respond({ slots: this.sql.exec('SELECT slot, revision, data FROM saves ORDER BY slot').toArray() });
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
