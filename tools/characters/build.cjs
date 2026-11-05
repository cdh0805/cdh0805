// Render the 반달이 / 꼬미 sprite sheets from the rigged turnaround art.
//
//   node tools/characters/build.cjs   → assets/characters/<id>/{sheet.png,manifest.json}
//
// Needs Playwright's Chromium (a devDependency of this repo).
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SRC = path.join(__dirname, 'source');
const OUT = path.join(__dirname, '..', '..', 'assets', 'characters');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ path: path.join(__dirname, 'rig.js') });
  const rigs = await page.evaluate(() => Object.fromEntries(Object.entries(Rig.RIGS).map(([k, r]) => [k, Object.keys(r.views)])));
  for (const [char, viewNames] of Object.entries(rigs)) {
    for (const v of viewNames) {
      const text = fs.readFileSync(path.join(SRC, `${char}-${v}.svg`), 'utf8');
      await page.evaluate(([c, n, t]) => { Rig.load(c, n, t); }, [char, v, text]);
    }
    const { png, manifest } = await page.evaluate((c) => Rig.buildSheet(c), char);
    const dir = path.join(OUT, char);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'sheet.png'), Buffer.from(png.split(',')[1], 'base64'));
    manifest.sheet = 'sheet.png';
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
    const kb = (fs.statSync(path.join(dir, 'sheet.png')).size / 1024).toFixed(0);
    console.log(`${char}: ${Object.keys(manifest.anims).length} animations, ${manifest.frameWidth}x${manifest.frameHeight} frames, sheet ${kb} KB`);
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
