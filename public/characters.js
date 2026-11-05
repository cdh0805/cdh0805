// 반달이 (Bandal) & 꼬미 (Kkomi) as office staff: sprite sheets rendered by
// tools/characters/build.cjs from the official turnaround art, eight facing
// directions, frame-by-frame walk / idle / sit / type / wave / nap / hold /
// reach. Shared by the 2D office (canvas) and the 3D office (billboards).
(() => {
  'use strict';

  const BASE = '/assets/characters/';
  // Screen-space facing, clockwise from +x with y pointing down.
  const DIRS = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
  const ANGLE = Object.fromEntries(DIRS.map((d, i) => [d, i * 45]));

  const chars = {};
  let config = null;
  let ready = null;

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function load() {
    if (ready) return ready;
    ready = fetch(BASE + 'index.json')
      .then((r) => { if (!r.ok) throw new Error(`index.json ${r.status}`); return r.json(); })
      .then(async (cfg) => {
        await Promise.all(cfg.characters.map(async (c) => {
          const m = await fetch(`${BASE}${c.id}/manifest.json`).then((r) => r.json());
          const img = new Image();
          img.src = `${BASE}${c.id}/${m.sheet}`;
          await img.decode();
          chars[c.id] = { ...c, m, img, scale: c.height / m.height };
        }));
        config = cfg;
        return true;
      })
      .catch((e) => { console.warn('Office characters unavailable:', e); return false; });
    return ready;
  }

  // Who plays this session: by agent, subagents are the cub, the rest mixed.
  function castFor(s) {
    if (!config) return null;
    const c = config.cast || {};
    let id = s.subagent && c.subagent ? c.subagent : (c.agents || {})[s.agent];
    if (!id || !chars[id]) {
      const pool = (c.others || Object.keys(chars)).filter((k) => chars[k]);
      id = pool.length ? pool[hash(s.key || s.id || '') % pool.length] : null;
    }
    return id && chars[id] ? id : null;
  }

  // Facing for a movement on screen.
  function dirFromVector(vx, vy, fallback = 's') {
    if (Math.abs(vx) + Math.abs(vy) < 1e-6) return fallback;
    const a = ((Math.atan2(vy, vx) * 180) / Math.PI + 360) % 360;
    return DIRS[Math.round(a / 45) % 8];
  }

  // The closest direction an animation was drawn for.
  function nearestDir(entry, dir) {
    if (entry.dirs[dir] != null) return dir;
    let best = null, bd = 1e9;
    for (const d of Object.keys(entry.dirs)) {
      let diff = Math.abs(ANGLE[d] - ANGLE[dir]) % 360;
      if (diff > 180) diff = 360 - diff;
      if (diff < bd) { bd = diff; best = d; }
    }
    return best;
  }

  // Which cell of the sheet to show.
  //   t: ms clock, phase: 0..2π per person, dist: tiles walked (walk only)
  function frame(id, anim, dir, { t = 0, phase = 0, dist = 0 } = {}) {
    const ch = chars[id];
    if (!ch) return null;
    const m = ch.m;
    const entry = m.anims[anim] || m.anims.idle;
    const d = nearestDir(entry, dir);
    const n = entry.frames;
    let f = 0;
    if (anim === 'walk') {
      f = Math.floor((dist / ch.stride) * n) % n;
    } else if (entry.durations) {
      const total = entry.durations.reduce((a, b) => a + b, 0);
      let k = (t + (phase / (Math.PI * 2)) * total * 7.3) % total;
      while (f < n - 1 && k >= entry.durations[f]) { k -= entry.durations[f]; f++; }
    } else {
      f = Math.floor((t / 1000) * (entry.fps || 6) + phase * 3) % n;
    }
    const hand = entry.hands && entry.hands[d] ? entry.hands[d][f] : null;
    return {
      img: ch.img, sx: f * m.frameWidth, sy: entry.dirs[d] * m.frameHeight,
      sw: m.frameWidth, sh: m.frameHeight, ax: m.anchor[0], ay: m.anchor[1],
      top: entry.tops ? entry.tops[d] : m.height, hand, dir: d, f, scale: ch.scale,
    };
  }

  // Draw with the anchor (feet, or the seat when sitting) at (x, y).
  // Returns the y of the top of the head and the paw position, in canvas units.
  function draw(ctx, id, anim, dir, x, y, opts = {}) {
    const fr = frame(id, anim, dir, opts);
    if (!fr) return null;
    const k = fr.scale * (opts.scale || 1);
    const smooth = ctx.imageSmoothingEnabled, q = ctx.imageSmoothingQuality;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fr.img, fr.sx, fr.sy, fr.sw, fr.sh, x - fr.ax * k, y - fr.ay * k, fr.sw * k, fr.sh * k);
    ctx.imageSmoothingEnabled = smooth;
    ctx.imageSmoothingQuality = q;
    return {
      top: y - fr.top * k,
      hand: fr.hand ? { x: x + fr.hand[0] * k, y: y + fr.hand[1] * k } : null,
      width: chars[id].m.width * k,
    };
  }

  window.OfficeCharacters = {
    DIRS, load, castFor, dirFromVector, frame, draw,
    get: (id) => chars[id] || null,
    get ready() { return !!config; },
  };
})();
