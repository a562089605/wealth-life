const assert = require('node:assert/strict');
const cards = require('../shared-interest-cards');
const {allocateEventTimeDebt} = require('../time-ledger');

function seed(kind) {
  const state = {
    month: 2, cash: 100, health: 80, energy: 80, happiness: 50, stress: 20,
    people: [{id: 'friend', name: '林悦', relation: 35, interests: ['烘焙', '咖啡品鉴']}],
    hobbyLearning: {xp: {baking: 50, tasting: 50}},
    town: {movement: {id: 1, type: 'life', month: 2}, history: []}
  };
  assert.ok(cards.saveCard(state, kind, 'friend', 1, {save: () => true, random: () => 0}).ok);
  return state;
}

const save = () => true;
const single = seed('baking-burnt');
const singleId = cards.current(single).id;
const original = JSON.stringify(single);
assert.equal(cards.confirm(single, singleId, 0, 'pending', {free: 1, save: () => false}).reason, 'save');
assert.equal(JSON.stringify(single), original, 'failed saves roll back effects and time debt');
assert.ok(cards.confirm(single, singleId, 0, 'pending', {free: 1, save}).ok);
assert.equal(cards.hours(single), 1);
assert.equal(single.forcedTimeReturn.debt, 1);
assert.equal(single.cash, 60);
assert.equal(single.hobbyLearning.xp.baking, 55);
assert.equal(single.town.movement.resolved, true);
assert.equal(cards.confirm(single, singleId, 0, 'pending', {free: 0, save}).reason, 'stale');

const twoStage = seed('tasting-queue');
const twoStageId = cards.current(twoStage).id;
assert.ok(cards.confirm(twoStage, twoStageId, 1, 'pending', {free: 0, save}).followup);
assert.equal(twoStage.town.movement.resolved, undefined);
assert.equal(twoStage.forcedTimeReturn.debt, 1);
const restored = JSON.parse(JSON.stringify(twoStage));
assert.ok(cards.confirm(restored, twoStageId, 0, 'followup', {free: 0, save}).ok);
assert.equal(restored.forcedTimeReturn.debt, 2);
assert.equal(cards.hours(restored), 0);
assert.equal(restored.town.movement.resolved, true);
assert.equal(restored.sharedInterestCards.receipts.length, 2);
assert.equal(allocateEventTimeDebt(restored, {month: 3, baseHours: 10, recovery: false}).remainingHours, 8);
assert.equal(allocateEventTimeDebt(restored, {month: 3, baseHours: 10, recovery: false}).applied, 2);
assert.equal(allocateEventTimeDebt(restored, {month: 4, baseHours: 10, recovery: false}).applied, 0);

const affordable = seed('baking-burnt');
assert.ok(cards.confirm(affordable, cards.current(affordable).id, 1, 'pending', {free: 5, save}).ok);
assert.equal(cards.hours(affordable), 1);
assert.equal(affordable.forcedTimeReturn, undefined);

const noCash = seed('baking-burnt');
noCash.cash = 0;
assert.equal(cards.confirm(noCash, cards.current(noCash).id, 0, 'pending', {free: 0, save}).reason, 'funds');
assert.equal(noCash.forcedTimeReturn, undefined);
