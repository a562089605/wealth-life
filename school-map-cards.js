(function () {
 'use strict';

 const artRoot = 'assets/school-career/map/';
 const stats = [
  ['hours', '自由时间', ' 小时'], ['energy', '能量', ''], ['stress', '压力', ''],
  ['happiness', '幸福度', ''], ['communication', '沟通协调', ' XP']
 ];

 function draw(move, deck) {
  if (move.schoolCard) return deck.find(card => card.id === move.schoolCard);
  const seen = state.schoolCareer?.mapCardsSeen || [];
  const unseen = deck.filter(card => !seen.includes(card.id));
  const pool = unseen.length ? unseen : deck;
  const card = pool[Math.floor(Math.random() * pool.length)];
  return PetMapEvents.atomic(state, () => {
   const school = state.schoolCareer ??= {};
   const previous = unseen.length ? seen : seen.filter(id => !deck.some(card => card.id === id));
   school.mapCardsSeen = [...previous, card.id];
   move.schoolCard = card.id;
  }, save) ? card : null;
 }

 function accept(move, card, option) {
  const free = currentCareerTime().free;
  const effects = option.effects;
  const hours = effects.hours || 0;
  const forced = card.options.length === 1;
  if (state.town?.movement !== move || move.resolved || hours > free && !forced) return;
  const ok = PetMapEvents.atomic(state, () => {
   const school = state.schoolCareer ??= {};
   if (hours) {
    const used = Math.min(free, hours);
    if (forced && hours > free) {
     const id = 'school-map-' + move.id;
     const time = recordForcedEventTime(state, {id, month:state.month, hours, available:free});
     state.forcedTimeReturn = {month:state.month, id, debt:time.debt, reasons:['职业事件耗尽自由时间']};
    }
    if (school.mapTime?.month !== state.month) school.mapTime = {month:state.month, hours:0};
    school.mapTime.hours += used;
   }
   for (const stat of ['energy','stress','happiness']) {
    if (effects[stat]) state[stat] = Math.max(0, Math.min(100, state[stat] + effects[stat]));
   }
   if (effects.communication) {
    (school.skills ??= {}).communication = Math.min(
     SchoolCareer.thresholds.at(-1), SchoolCareer.xp(state, 'communication') + effects.communication
    );
   }
   move.resolved = true;
   move.completedMonth = state.month;
   (state.town.history ??= []).push({id:move.id, die:move.die, to:move.to,
    month:state.month, type:'career', offerId:card.id, outcome:option.label});
  }, save);
  if (!ok) {
   showEvent('职业事件', '暂未保存', '本次选择尚未生效，请重试。', [],
    [['返回卡片', () => open(state.town.movement), true]]);
   $('eventClose').hidden = true;
   return;
  }
  clearModals();
  finish();
 }

 function renderCard(move, card) {
  showEvent('职业事件', card.title, card.story, [], []);
  if ($('eventTitle').textContent !== card.title) return;
  const box = $('eventData');
  const art = document.createElement('div');
  const image = document.createElement('img');
  art.className = 'career-hero career-event-hero';
  image.src = artRoot + card.id + '.webp';
  image.alt = '';
  art.append(image);
  box.replaceChildren(art);
  box.style.display = 'block';
  const owner = state, chosenSlot = slot, month = state.month;
  const free = currentCareerTime().free;
  for (const option of card.options) {
   const button = document.createElement('button');
   button.type = 'button';
   button.className = 'career-event-option';
   button.textContent = option.label;
   if (option.description) {
    const description = document.createElement('small');
    description.textContent = option.description;
    button.append(description);
   }
   const rows = document.createElement('div');
   rows.className = 'career-event-effects';
   for (const [key, label, unit] of stats) {
    let value = option.effects[key] || 0;
    if (key === 'hours') value = -value;
    if (key === 'communication') value = Math.min(value, Math.max(0,
     SchoolCareer.thresholds.at(-1) - SchoolCareer.xp(state, key)));
    if (!value) continue;
    const row = document.createElement('div');
    const name = document.createElement('span');
    const amount = document.createElement('strong');
    name.textContent = label;
    amount.textContent = (value > 0 ? '+' : '−') + Math.abs(value) + unit;
    row.append(name, amount);
    rows.append(row);
   }
   button.append(rows);
   const unavailable = card.options.length > 1 && (option.effects.hours || 0) > free;
   button.disabled = unavailable;
   if (unavailable) button.append('自由时间不足');
   button.onclick = () => {
    if (state !== owner || slot !== chosenSlot || state.month !== month || !button.isConnected || button.disabled) return;
    button.disabled = true;
    accept(move, card, option);
   };
   box.append(button);
  }
  box.closest('.event').classList.add('coffee-painted-event', 'career-event-live');
  $('eventClose').hidden = true;
 }

 function open(move) {
  const deck = schoolMapCards[state.job];
  if (!deck || !SchoolCareer.working(state) || !move || move.resolved) return false;
  const card = draw(move, deck);
  if (card) renderCard(move, card);
  else {
   showEvent('职业事件', '暂未保存', '职业卡尚未保存，请重试。', [],
    [['重试', () => open(state.town.movement), true]]);
   $('eventClose').hidden = true;
  }
  return true;
 }

 const timeBefore = currentCareerTime;
 currentCareerTime = function () {
  const time = timeBefore();
  const used = state?.schoolCareer?.mapTime;
  return used && used.month === state.month
   ? {...time, free:Math.max(0, time.free - used.hours)} : time;
 };

 window.SchoolMapCards = {open};
})();
