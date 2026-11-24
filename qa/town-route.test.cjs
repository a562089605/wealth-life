const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../town.js'), 'utf8');

async function verify() {
  let randomBytes = [];
  let resumeCalls = 0;
  let billOpens = 0;
  let landings = 0;
  const c = {
    save: () => true,
    render() {},
    clearModals() {},
    openGame() {},
    syncFinance() {},
    livingBillQuote: () => ({
      selected: !!c.state.housing,
      blocked: !!c.state.handoverDue,
      housing: c.state.monthlyPayments?.month === c.state.month ? 0 : 500,
    }),
    window: {openLifeOverview() { billOpens++; }},
    openTownLanding() { landings++; },
    resumeTownMove() { resumeCalls++; },
    document: {querySelector: () => null, querySelectorAll: () => []},
    matchMedia: () => ({matches: true}),
    crypto: {getRandomValues(buffer) { buffer[0] = randomBytes.shift(); }},
  };
  vm.createContext(c);
  const start = source.indexOf('const TOWN_LEGACY_TYPES=');
  const gate = source.indexOf('function townHousingBlocked()');
  const roll = source.indexOf('function rollTown()');
  const resume = source.indexOf('function resumeTownMove()');
  vm.runInContext(source.slice(start, source.indexOf('function townStart', gate)) + source.slice(roll, resume), c);

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
      c.state={townMode:true, housing:'family', month:11, monthlyPayments:{month:11}, town:{position:from, rolls:0, movement:null, history:[]}};
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
  c.state={townMode:true,housing:'family',month:0,monthlyPayments:{month:0},town:{position:0,rolls:0,movement:null,history:[]}};
  c.save=()=>false;
  randomBytes=[2];
  c.rollTown();
  assert.equal(c.state.town.position,0);
  assert.equal(c.state.town.movement,null);
  assert.equal(c.state.town.rolls,0);
  vm.runInContext(source.slice(resume, source.indexOf('function previewTownPayday()')), c);
  const pending = {id: 9, type: 'life', month: 1, resolved: false};
  c.state = {
    townMode: true, roomLocation: 'town', housing: 'family', month: 1,
    monthlyPayments: {month: 0}, town: {movement: pending},
  };
  const load = source.indexOf('const townOpenBefore=openGame;');
  vm.runInContext(source.slice(load, source.indexOf('const townShowBefore=', load)), c);
  c.openGame();
  assert.equal(billOpens, 1, 'prior-month receipt must open the bill');
  assert.equal(landings, 0);
  assert.equal(c.state.town.movement, pending);
  assert.equal(pending.resolved, false);
  c.state.monthlyPayments.month = 1;
  c.state.handoverDue = true;
  c.resumeTownMove();
  assert.equal(billOpens, 2, 'handover still blocks the pending event');
  assert.equal(landings, 0);
  c.state.handoverDue = false;
  c.resumeTownMove();
  assert.equal(landings, 1, 'current-month payment resumes the same event');
  assert.equal(c.state.town.movement, pending);
  console.log('PASS: equal die distribution, rejection sampling, 144 landings, double-click and save rollback');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
