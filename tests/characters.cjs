// 반달이 / 꼬미 sprite staff: the sheets and manifests are consistent, and the
// 2D office draws them (and stops when the setting is off).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', 'assets', 'characters');
const DIRS = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];

function pngSize(file) {
  const b = fs.readFileSync(file);
  assert.equal(b.toString('ascii', 1, 4), 'PNG');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

test('every character has a sheet whose rows cover all its animations', () => {
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'));
  assert.ok(index.characters.length >= 2);
  for (const c of index.characters) {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, c.id, 'manifest.json'), 'utf8'));
    const { w, h } = pngSize(path.join(ROOT, c.id, m.sheet));
    const rows = new Set();
    for (const [name, a] of Object.entries(m.anims)) {
      assert.ok(a.frames > 0 && a.frames * m.frameWidth <= w, `${c.id}/${name} fits the sheet width`);
      assert.ok(a.fps > 0 || (Array.isArray(a.durations) && a.durations.length === a.frames), `${c.id}/${name} has timing`);
      for (const [dir, row] of Object.entries(a.dirs)) {
        assert.ok(DIRS.includes(dir), `${c.id}/${name}: ${dir}`);
        assert.ok(!rows.has(row), `${c.id}: row ${row} used once`);
        rows.add(row);
        assert.ok((row + 1) * m.frameHeight <= h, `${c.id}/${name}/${dir} row inside the sheet`);
        assert.ok(a.tops[dir] > 0 && a.tops[dir] <= m.anchor[1], `${c.id}/${name}/${dir} top`);
      }
      if (a.hands) for (const list of Object.values(a.hands)) assert.equal(list.length, a.frames);
    }
    // Walking and standing are drawn for all eight directions.
    for (const name of ['walk', 'idle']) assert.deepEqual(Object.keys(m.anims[name].dirs).sort(), [...DIRS].sort());
    assert.equal(rows.size * m.frameHeight, h);
  }
});

test('the cast maps agents and subagents to known characters', () => {
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'));
  const ids = new Set(index.characters.map((c) => c.id));
  for (const id of Object.values(index.cast.agents)) assert.ok(ids.has(id));
  assert.ok(ids.has(index.cast.subagent));
  for (const id of index.cast.others) assert.ok(ids.has(id));
});

test('the 2D office draws sprite staff and falls back when switched off', { timeout: 120_000 }, async () => {
  const { chromium } = require('playwright');
  process.env.WMAD_NO_UPDATE_CHECK = '1';
  const { createServer } = require('../src/server');
  const { DemoWatcher } = require('../src/demo');
  const watcher = new DemoWatcher().start();
  const server = createServer(watcher, { demo: true, privacy: false });
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
  const port = server.address().port;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${port}/?view=office&quality=mid`);
    await page.waitForFunction(() => window.OfficeCharacters?.ready && typeof office !== 'undefined' && office.people.size > 0 && office.framesShown > 3);
    const drawn = () => page.evaluate(() => {
      const sheets = new Set(['bandal', 'kkomi'].map((id) => OfficeCharacters.get(id).img));
      let n = 0;
      const orig = office.ctx.drawImage;
      office.ctx.drawImage = function (img, ...rest) { if (sheets.has(img)) n++; return orig.call(this, img, ...rest); };
      try { office.frame(performance.now()); } finally { office.ctx.drawImage = orig; }
      return { n, people: office.people.size + office.crew.size, cast: [...office.everyone()].map((p) => p.cast) };
    });
    const on = await drawn();
    assert.equal(on.n, on.people, 'one sprite per person, lounge crew included');
    assert.ok(on.cast.every((c) => c === 'bandal' || c === 'kkomi'));
    // Claude is 반달이, Codex is 꼬미.
    const byAgent = await page.evaluate(() => [...office.people.values()].map((p) => [p.s.agent, p.cast]));
    for (const [agent, cast] of byAgent) {
      if (agent === 'claude') assert.equal(cast, 'bandal');
      if (agent === 'codex') assert.equal(cast, 'kkomi');
    }
    // Settings → switch off: hand-drawn people again, and it is remembered.
    await page.click('#settingsMenu > summary');
    await page.click('#bearsToggle');
    await page.click('#crewToggle');
    assert.equal((await drawn()).n, 0);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('wmad.bears'))), false);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server.close();
    watcher.stop();
  }
});

test('with no work the lounge crew fills the break room, and leaves when agents take over', { timeout: 120_000 }, async () => {
  const { chromium } = require('playwright');
  process.env.WMAD_NO_UPDATE_CHECK = '1';
  const { createServer } = require('../src/server');
  const { DemoWatcher } = require('../src/demo');
  const watcher = new DemoWatcher().start();
  const server = createServer(watcher, { demo: true, privacy: false });
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?view=office&quality=mid`);
    await page.waitForFunction(() => window.OfficeCharacters?.ready && typeof office !== 'undefined' && office.framesShown > 3);
    // Mute the live demo feed and drive the office by hand.
    await page.evaluate(() => { window.__feed = onData; window.onData = () => {}; });
    const feed = (sessions) => page.evaluate((s) => window.__feed({ now: Date.now(), sessions: s.map((x) => ({ ...x, lastEventAt: Date.now(), cwd: '/demo/' + x.id })) }), sessions);
    // Let anyone who is walking out finish leaving.
    const settle = () => page.evaluate(() => { for (let i = 0; i < 400; i++) office.step(0.05); });

    await feed([]);
    await settle();
    let crew = await page.evaluate(() => [...office.crew.values()].map((p) => ({ cast: p.cast, mode: p.mode, poi: p.poi && p.poi.act })));
    assert.equal(crew.length, 4, 'four residents with nobody around');
    assert.deepEqual(crew.map((c) => c.cast).sort(), ['bandal', 'bandal', 'kkomi', 'kkomi']);
    assert.ok(crew.every((c) => c.mode === 'wander' && c.poi), 'each one is at a spot in the office');
    assert.equal(await page.evaluate(() => office.people.size), 0, 'residents are not agents');
    // Not hoverable, no agent card.
    await page.evaluate(() => office.frame(performance.now()));
    assert.equal(await page.evaluate(() => office.hit.filter((h) => h.key.startsWith('crew:')).length), 0);

    // Two agents finish work: they take over the lounge, two residents leave.
    await feed([{ key: 'claude:a', id: 'a', agent: 'claude', status: 'done' }, { key: 'codex:b', id: 'b', agent: 'codex', status: 'done' }]);
    await settle();
    assert.equal(await page.evaluate(() => office.crew.size), 2);

    // A busy agent at a desk does not send anyone home.
    await feed([{ key: 'claude:c', id: 'c', agent: 'claude', status: 'tool', activity: 'Bash: npm test' }]);
    await settle();
    assert.equal(await page.evaluate(() => office.crew.size), 4);

    // Settings → Lounge crew off: they walk out, and it is remembered.
    await page.click('#settingsMenu > summary');
    await page.click('#crewToggle');
    await settle();
    assert.equal(await page.evaluate(() => office.crew.size), 0);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('wmad.crew'))), false);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server.close();
    watcher.stop();
  }
});
