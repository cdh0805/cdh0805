// Extract clean per-view SVGs of 반달이 (Bandal) and 꼬미 (Kkomi) from the
// official "Character Standards" PDF (turnaround pages CS06 / CS07). The
// sheet's left-facing side view is the mirror of the right one, so only front,
// back and right are kept; rig.js mirrors the right view for ←.
//
//   node tools/characters/extract.cjs <Character_Standards.pdf>
//
// Needs `pdftocairo` (poppler-utils) and Playwright's Chromium. Writes
// tools/characters/source/<character>-<view>.svg, keeping only the vector
// shapes that sit inside each figure's box (no guide lines, labels or rulers).
// Every kept leaf shape gets data-i="<n>" so rig.js can address its parts.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const VIEWS = [
  // page, character, view, [x0, y0, x1, y1] in PDF points
  [7, 'bandal', 'front', [145, 393, 223, 540]],
  [7, 'bandal', 'back', [247, 393, 323, 540]],
  [7, 'bandal', 'right', [352, 393, 417, 540]],
  [8, 'kkomi', 'front', [168, 476, 218, 537]],
  [8, 'kkomi', 'back', [262, 476, 312, 537]],
  [8, 'kkomi', 'right', [366, 476, 410, 537]],
];

async function main() {
  const pdf = process.argv[2];
  if (!pdf || !fs.existsSync(pdf)) { console.error('usage: node extract.cjs <Character_Standards.pdf>'); process.exit(1); }
  const out = path.join(__dirname, 'source');
  fs.mkdirSync(out, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chars-'));
  const pages = {};
  for (const page of new Set(VIEWS.map((v) => v[0]))) {
    const file = path.join(tmp, `p${page}.svg`);
    execFileSync('pdftocairo', ['-svg', '-f', String(page), '-l', String(page), pdf, file]);
    pages[page] = fs.readFileSync(file, 'utf8');
  }
  const browser = await chromium.launch();
  const tab = await browser.newPage();
  for (const [page, name, view, box] of VIEWS) {
    await tab.setContent(`<html><body style="margin:0">${pages[page]}</body></html>`);
    const svg = await tab.evaluate(([x0, y0, x1, y1]) => {
      const root = document.querySelector('svg');
      const tol = 0.5;
      let i = 0;
      const leaves = [...root.querySelectorAll('path, use, image, rect, circle')]
        .filter((el) => !el.closest('defs') && !el.closest('clipPath'));
      for (const el of leaves) {
        const r = el.getBoundingClientRect();
        const inside = r.x >= x0 - tol && r.y >= y0 - tol && r.x + r.width <= x1 + tol && r.y + r.height <= y1 + tol;
        if (inside && r.width * r.height > 0) el.setAttribute('data-i', String(i++));
        else el.remove();
      }
      // Drop groups left empty.
      let again = true;
      while (again) {
        again = false;
        for (const g of root.querySelectorAll('g')) {
          if (!g.closest('defs') && !g.querySelector('[data-i]')) { g.remove(); again = true; }
        }
      }
      // Keep only the defs (gradients, clip paths, glyphs) still referenced.
      const used = new Set();
      const refs = (el) => {
        for (const a of el.getAttributeNames()) {
          const v = el.getAttribute(a);
          for (const m of v.matchAll(/url\(#([^)]+)\)/g)) used.add(m[1]);
          if (/href$/.test(a) && v.startsWith('#')) used.add(v.slice(1));
        }
      };
      const queue = [...root.querySelectorAll('*')].filter((el) => !el.closest('defs'));
      queue.forEach(refs);
      const defs = root.querySelector('defs');
      let grew = true;
      while (grew) {
        grew = false;
        for (const d of defs ? [...defs.children] : []) {
          if (used.has(d.id) && !d.dataset.seen) {
            d.dataset.seen = '1'; grew = true;
            refs(d); d.querySelectorAll('*').forEach(refs);
          }
        }
      }
      for (const d of defs ? [...defs.children] : []) { if (!used.has(d.id)) d.remove(); else delete d.dataset.seen; }
      root.setAttribute('viewBox', `${x0} ${y0} ${x1 - x0} ${y1 - y0}`);
      root.setAttribute('width', String(x1 - x0));
      root.setAttribute('height', String(y1 - y0));
      return new XMLSerializer().serializeToString(root).replace(/\n{2,}/g, '\n');
    }, box);
    const file = path.join(out, `${name}-${view}.svg`);
    fs.writeFileSync(file, svg);
    console.log(`${path.relative(process.cwd(), file)}  ${(svg.length / 1024).toFixed(0)} KB`);
  }
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
main().catch((e) => { console.error(e); process.exit(1); });
