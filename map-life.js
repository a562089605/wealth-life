// Map life cards. Each stage is saved before its controls can be used.
(function () {
  const option = (label, effects = {}) => ({label, ...effects});
  const card = (title, body, ...options) => ({title, body, options});
  const cards = {
    coffee: card('今日份快乐', '你路过咖啡店买咖啡。店员笑着说，前一位顾客已经替你付了账。',
      option('也请下一位喝一杯', {cash:-7, happiness:6, stress:-2}), option('谢过离开', {happiness:3, stress:-2})),
    books: card('免费书架', '路过社区书架，你发现一本一直想看的书。',
      option('坐下来读一会儿', {hours:1, happiness:4, stress:-3}), option('把书带走，下次再读', {happiness:1}), option('买一本书来交换', {cash:-12, happiness:5})),
    late: card('上班迟到了', '车刚开走。再等一班，你就要迟到了。',
      option('等下一班公交', {hours:2, stress:3}), option('打车赶过去', {cash:-24, stress:1})),
    phone: card('手机摔坏了', '手机掉在地上，屏幕裂了，勉强还能用。',
      option('进店换屏', {cash:-329, stress:-2}), option('换一部新手机', {cash:-1299, happiness:6, stress:-2, next:'photo'}), option('先用着，改天再修')),
    stoodUp: card('被放飞机了', '约好的朋友临时来不了。你已经到了，接下来做什么？',
      option('回家'), option('在附近逛一逛', {hours:1, energy:-1, happiness:2, next:'oldFriend'}),
      option('去路边书店看会儿书', {hours:1, stress:-3, next:'reader'}), option('去吃一顿美味的下午茶', {cash:-28, hours:1, happiness:5, stress:-2})),
    tooth: card('牙突然疼起来了', '牙疼了一早上。现在去医院，还是等手头的事办完？',
      option('直接去医院', {hours:1, energy:-2, stress:2, next:'dentist'}), option('今天还有事，先忍一忍', {happiness:-3, stress:3, energy:-2})),
    community: card('社区活动的邀请', '社区过几天有一场活动，工作人员问你愿不愿来帮忙。',
      option('好啊，那天我来帮忙', {next:'volunteer'}), option('谢谢邀请，这次就不去了')),
    movie: card('广场上的露天电影', '路过广场，露天电影快开场了，后排还有空位。',
      option('看', {hours:2, happiness:6, stress:-3}), option('不看')),
    cake: card('温暖小惊喜', '朋友发消息问你在哪。刚吃到一家好吃的蛋糕，顺手给你带了一份。',
      option('接过蛋糕，谢谢你', {happiness:4, intimacy:2})),
    paving: card('踩到一块松动的地砖', '砖缝里溅出一片水，你的鞋袜都湿了。',
      option('去收拾一下', {hours:1, happiness:-2, stress:2, forced:true})),
    photo: card('新手机的第一张照片', '出门试拍新手机时，你看见社区正在征集照片。',
      option('拍几张留给自己', {hours:1, happiness:4, stress:-2}),
      option('挑一张照片投稿', {hours:1, happiness:2, next:'submission'}), option('收起手机，继续走')),
    selected: card('你的照片入选了', '社区发来通知，你的照片入选了展览。',
      option('领取奖金', {cash:60, next:'email'})),
    email: card('一封来自摄影爱好者的邮件', '对方说很喜欢你的照片，想认识你，以后交流拍摄心得。',
      option('回信认识一下', {contact:'摄影爱好者'}), option('看完邮件，不回信')),
    oldFriend: card('碰见老朋友', '走着走着，你碰见一位老朋友，你们决定一起逛逛。',
      option('一起逛逛', {intimacy:3})),
    rejoinedFriend: card('朋友赶来了', '刚才爽约的朋友发来消息，说事情提前办完了，人就在附近。对方向你道了歉，问要不要一起走走。',
      option('一起逛逛', {intimacy:3})),
    soloWalk: card('自己走走', '你顺着街道慢慢逛了一圈，准备继续今天的行程。', option('继续走')),
    reader: card('你也喜欢这个作者？', '书店里有人拿起了你最喜欢的那本书，你们聊了起来。',
      option('交换联系方式', {contact:'书友'})),
    today: card('今天还有号', '前台查了排班，今天还有一个号。',
      option('现在看诊', {treatment:true, stress:-5, happiness:2})),
    noSlot: card('今天没号了', '今天的号已经满了，前台可以帮你约下次看诊。',
      option('预约看诊', {stress:-1, appointment:true})),
    booking: card('到预约时间了', '到了约好的时间，你再次来到医院。',
      option('按预约看诊', {hours:1, treatment:true, stress:-5, happiness:2, forced:true})),
    volunteer: card('活动这天', '你到社区报到，和志愿者们一起布置场地，认识了一位邻居。',
      option('完成义工活动', {hours:3, energy:-3, happiness:4, contact:'邻居', forced:true}))
  };
  const lateFallback = option('先通知店里会迟到', {stress:4});
  const mainCards = ['coffee','books','late','phone','stoodUp','tooth','community','movie','cake','paving'];
  const art = new Set([...mainCards,'photo','selected','email','oldFriend','reader','today','noSlot','booking','volunteer']);
  const pick = items => items[Math.floor(Math.random() * items.length)];
  const people = () => (state.people || []).filter(person => person && person.id != null);
  const friends = () => people().filter(person => /朋友|好友|书友/.test(person.status || '') ||
    ['friend','pet-social','map-life'].includes(person.origin));
  const clamp = n => Math.max(0, Math.min(100, n));
  const data = () => state.mapLife ??= {seen:{}, hours:{}, appointment:null};
  const movement = () => state.town?.movement;
  const persist = () => save() !== false;

  function eligible(id) {
    if (id === 'late') return state.job && !state.retired && !state.unemployedMonths;
    if (id === 'stoodUp') return people().length > 0;
    if (id === 'cake') return friends().length > 0;
    if (id === 'tooth') return !data().appointment;
    return true;
  }

  function due(move) {
    const appointment = data().appointment;
    return appointment && (state.month > appointment.month || move.id > appointment.moveId);
  }

  function createRecord(move, appointmentOnly) {
    const store = data();
    const available = mainCards.filter(id => store.seen[id] !== state.month && eligible(id));
    const id = appointmentOnly ? null : pick(available);
    if (!id && !due(move)) return false;
    const person = id === 'stoodUp' ? pick(people()) : id === 'cake' ? pick(friends()) : null;
    move.mapLife = {id, stage:id || 'booking', step:0, personId:person?.id};
    move.opened = true;
    if (id) store.seen[id] = state.month;
    if (id === 'stoodUp') person.relation = clamp((person.relation || 0) - 1);
    return true;
  }

  function addContact(kind, move) {
    const id = 'map-life-' + state.month + '-' + move.id + '-' + kind;
    state.people ??= [];
    if (state.people.some(person => person.id === id)) return;
    const name = NPC_NAMES.find(name => !state.people.some(person => person.name === name)) || kind;
    state.people.push({id, name, age:state.age || 22, job:kind, city:state.city,
      status:'朋友', origin:'map-life', relation:10, lastInteractionMonth:state.month,
      ...(kind === '摄影爱好者' ? {interests:['摄影']} : {})});
  }

  function nextStage(q, move, record) {
    switch (q.next) {
      case 'dentist': return Math.random() < .5 ? 'today' : 'noSlot';
      case 'submission': return Math.random() < .4 ? 'selected' : null;
      case 'oldFriend': {
        const friend = pick(friends().filter(person => person.id !== record.personId));
        if (friend) {
          record.personId = friend.id;
          return 'oldFriend';
        }
        return friends().some(person => person.id === record.personId) ? 'rejoinedFriend' : 'soloWalk';
      }
      default: return q.next || (record.stage !== 'booking' && due(move) ? 'booking' : null);
    }
  }

  function cost(q) {
    return q.treatment ? roundCash(-240 * (1 - medicalCoverage(state))) : q.cash || 0;
  }

  function finishCard(move) {
    move.mapLife.stage = null;
    move.resolved = true;
    move.completedMonth = state.month;
    (state.town.history ??= []).push({id:move.id, die:move.die, to:move.to,
      month:state.month, type:'life', lifeCard:move.mapLife.id || 'booking'});
  }

  function accept(move, stage, step, q) {
    const record = move.mapLife;
    const free = currentCareerTime().free;
    const cash = cost(q);
    if (movement() !== move || move.resolved || record.step !== step || record.stage !== stage ||
        cash < 0 && state.cash < -cash || q.hours > free && !q.forced) return;
    const ok = PetMapEvents.atomic(state, () => {
      if (cash) {
        state.cash = roundCash(state.cash + cash);
        (state.financeLedger ??= []).push({kind:cash > 0 ? 'lifeReward' : 'lifeIncident',
          amount:Math.abs(cash), month:state.month, eventId:'map-life-'+move.id+'-'+step, source:'mapLife'});
      }
      for (const stat of ['energy','happiness','stress']) {
        if (q[stat]) state[stat] = clamp((state[stat] || 0) + q[stat]);
      }
      const person = people().find(person => person.id === record.personId);
      if (person && q.intimacy) person.relation = clamp((person.relation || 0) + q.intimacy);
      if (q.contact) addContact(q.contact, move);
      if (q.hours) {
        const time = q.forced && q.hours > free
          ? recordForcedEventTime(state, {id:'map-life-'+move.id+'-'+step, month:state.month, hours:q.hours, available:free})
          : null;
        const hours = data().hours;
        hours[state.month] = (hours[state.month] || 0) + (time?.used ?? q.hours);
      }
      if (q.appointment) data().appointment = {moveId:move.id, month:state.month};
      if (stage === 'booking') data().appointment = null;
      const next = nextStage(q, move, record);
      record.step++;
      if (next) record.stage = next;
      else if (stage !== 'booking' && due(move)) record.stage = 'booking';
      else finishCard(move);
    }, persist);
    if (!ok) {
      showEvent('生活事件', '暂未保存', '请重新打开当前事件。', [], [['重试', () => openCard(movement()), true]]);
      return;
    }
    if (move.resolved) { $('eventClose').hidden = false; clearModals(); finish(); }
    else openCard(move);
  }

  function openCard(move) {
    const {stage, step} = move.mapLife;
    const entry = cards[stage];
    const free = currentCareerTime().free;
    const unavailable = (q, amount) => amount < 0 && state.cash < -amount || q.hours > free && !q.forced;
    const choices = stage === 'late' && entry.options.every(q => unavailable(q, cost(q)))
      ? [...entry.options, lateFallback]
      : entry.options;
    const options = choices.map(q => {
      const effects = [];
      if (q.treatment) effects.push('治疗费 $240');
      else if (q.cash) effects.push((q.cash > 0 ? '+' : '−') + priceText(Math.abs(q.cash)));
      if (q.hours) effects.push('自由时间 −' + q.hours + ' 小时');
      for (const [key, label] of [['energy','精力'],['happiness','幸福'],['stress','压力'],['intimacy','亲密度']]) {
        if (q[key]) effects.push(label + ' ' + (q[key] > 0 ? '+' : '−') + Math.abs(q[key]));
      }
      return {q, effects, amount:cost(q)};
    });
    const actions = options.map(({q, amount}, index) =>
      [q.label, () => accept(move, stage, step, q), q === lateFallback || index === 0, unavailable(q, amount)]);
    if (options.some(({amount}) => amount < 0 && state.cash < -amount && typeof showFundingOptions === 'function')) {
      const need = Math.min(...options.filter(({amount}) => amount < 0 && state.cash < -amount).map(({amount}) => -amount));
      actions.push(['查看资金处理', () => showFundingOptions(need, () => { if (movement() === move && !move.resolved) openCard(move); }), false]);
    }
    const boxes = options.filter(({effects}) => effects.length).map(({q,effects}) => [q.label, effects.join(' · ')]);
    showEvent('生活事件', entry.title, entry.body, boxes, actions);
    if (art.has(stage)) {
      const picture = document.createElement('img');
      picture.src = 'assets/map-life/' + stage + '.webp';
      picture.alt = '';
      picture.style.cssText = 'display:block;width:100%;max-width:30rem;margin:0 auto 12px;border-radius:12px';
      $('eventData').prepend(picture);
      $('eventData').style.display = 'block';
    }
    $('eventClose').hidden = true;
  }

  const timeBefore = currentCareerTime;
  currentCareerTime = function () {
    const time = timeBefore();
    return {...time, free:Math.max(0, time.free - (state?.mapLife?.hours[state.month] || 0))};
  };

  window.mapLifeAppointmentDue = move => !!move && !move.resolved && !!state.mapLife?.appointment && due(move);
  window.openMapLife = function (move, appointmentOnly = false) {
    if (!move.mapLife) {
      const hasCard = mainCards.some(id => data().seen[id] !== state.month && eligible(id));
      if (!hasCard && !due(move)) return resolveTownMove();
      const ok = PetMapEvents.atomic(state, () => createRecord(move, appointmentOnly), persist);
      if (!ok) return showEvent('生活事件', '暂未保存', '请重试。', [], [['重试', () => window.openMapLife(movement(), appointmentOnly), true]]);
    }
    openCard(move);
    return true;
  };
})();
