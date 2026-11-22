const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../town.js'), 'utf8');

async function verify() {
  let randomBytes = [];
  let resumeCalls = 0;
  const c = {
    save: () => true,
    render() {},
    resumeTownMove() { resumeCalls++; },
    document: {querySelector: () => null, querySelectorAll: () => []},
    matchMedia: () => ({matches: true}),
    crypto: {getRandomValues(buffer) { buffer[0] = randomBytes.shift(); }},
  };
  vm.createContext(c);
  const start = source.indexOf('const TOWN_LEGACY_TYPES=');
  const end = source.indexOf('function townStart');
  const roll = source.indexOf('function rollTown()');
  const resume = source.indexOf('function resumeTownMove()');
  vm.runInContext(source.slice(start, end) + source.slice(roll, resume), c);

  vm.runInContext('townVisible=true', c);
  const types = Array.from(vm.runInContext('TOWN_TYPES', c));
  assert.equal(types.length, 24);
  assert.deepEqual(types.flatMap((type, i) => type === 'payday' ? [i + 1] : []), [1, 7, 13, 19]);
  for (const [type,count] of Object.entries({opportunity:10, life:7, career:3})) {
    assert.equal(types.filter(value => value === type).length, count);
  }
  assert.equal(c.townMoveType({to:4}), 'market');
  assert.equal(c.townMoveType({to:4, type:'opportunity'}), 'opportunity');

  const counts = Array(6).fill(0);
  for (let byte = 0; byte < 252; byte++) {
    randomBytes = [byte];
    counts[c.townDie() - 1]++;
  }
  assert.deepEqual(counts, [42,42,42,42,42,42]);
  randomBytes = [255,252,5];
  assert.equal(c.townDie(), 6);

  for (let from=0; from<24; from++) {
    for (let die=1; die<=6; die++) {
      c.state={townMode:true, housing:'family', month:11, town:{position:from, rolls:0, movement:null, history:[]}};
      randomBytes=[die-1];
      const before=resumeCalls;
      c.rollTown();
      c.rollTown();
      const town=c.state.town;
      assert.equal(town.rolls,1);
      assert.equal(town.movement.die,die);
      assert.equal(town.movement.path.length,die);
      assert.equal(town.movement.to,(from+die)%24);
      assert.equal(town.movement.type,types[town.position]);
      assert.equal(town.movement.payExpected,types[town.position]==='payday'?12:null);
      await new Promise(resolve=>setImmediate(resolve));
      assert.equal(resumeCalls,before+1);
      c.rollTown();
      assert.equal(town.rolls,1);
    }
  }
  c.state={townMode:true,housing:'family',month:0,town:{position:0,rolls:0,movement:null,history:[]}};
  c.save=()=>false;
  randomBytes=[2];
  c.rollTown();
  assert.equal(c.state.town.position,0);
  assert.equal(c.state.town.movement,null);
  assert.equal(c.state.town.rolls,0);
  console.log('PASS: equal die distribution, rejection sampling, 144 landings, double-click and save rollback');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
