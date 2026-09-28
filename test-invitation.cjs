const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app.js', 'utf8');
const opening = source.slice(source.indexOf('(() => {', source.indexOf('})();') + 5));
async function check(reduced, missing, fallbackOnly = false) {
  const elements = {};
  const timers = new Map();
  let plays = 0, focused = 0;
  for (const id of ['opening', 'invitation', 'open-invitation', 'music']) {
    elements[id] = { hidden: true, disabled: false, events: {}, classList: { add() {} },
      addEventListener(name, fn) { this.events[name] = fn; } };
  }
  const music = elements.music;
  music.play = () => { plays++; return missing ? Promise.reject(new Error('missing')) : Promise.resolve(); };
  vm.runInNewContext(opening, {
    document: { getElementById: id => elements[id], body: { classList: { add() {}, remove() {} } }, querySelector: () => ({focus() { focused++; }}) },
    window: { matchMedia: () => ({matches: reduced}), scrollTo() {} },
    setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  elements['open-invitation'].events.click();
  elements['open-invitation'].events.click();
  assert.equal(plays, 1);
  if (!reduced) {
    elements.opening.events.animationend({target: music, animationName: 'float'});
    assert.equal(elements.invitation.hidden, true);
    if (fallbackOnly) [...timers.values()][0]();
    else elements.opening.events.animationend({target: elements.opening, animationName: 'cover-away'});
  }
  assert.equal(elements.invitation.hidden, false);
  assert.equal(elements.opening.hidden, true);
  assert.equal(focused, 1);
  assert.equal(timers.size, 0);
  music.events.loadedmetadata(); assert.equal(music.hidden, false);
  music.events.error(); assert.equal(music.hidden, true);
  await Promise.resolve();
}
(async () => {
  await check(false, false);
  await check(true, true);
  await check(false, true, true);
  console.log('PASS: opening, reduced motion, fallback, duplicate clicks, audio and missing MP3.');
})();
