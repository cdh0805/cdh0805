// Cut-out rig for 반달이 (Bandal) and 꼬미 (Kkomi), built on the official
// turnaround art extracted by extract.cjs. Runs in the browser: build.cjs
// loads it into Chromium together with the source SVGs and calls
// Rig.buildSheet(), which renders every frame of every animation and
// direction into one sprite sheet.
//
// How a frame is made: the source view (front / back / right) is cloned into
// layers (torso, each leg, each arm), each clipped to its region of the one
// body silhouette and moved on its own: legs lift (front/back) or shear
// (side), arms swing around the shoulder, the body bobs and leans. Turned
// three-quarter views slide the surface features (eyes, muzzle, chest mark,
// hat badge, ears, tail…) around a cylinder, so the outline stays exactly as
// drawn and only the face turns. The art itself is never redrawn or
// recoloured; closed eyes are the only shapes added.
'use strict';

(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  // ---------------------------------------------------------------- rigs
  // Coordinates are in the PDF points of each source view.
  const RIGS = {
    bandal: {
      name: '반달이',
      px: 1.0, // output pixels per source unit
      frame: { w: 96, h: 158, foot: 150 }, // frame box (units) and ground line from its top
      arm: { len: 31, w0: 9.5, w1: 11, line: 1.35 }, // a lifted arm: length, shoulder / paw width, contour
      views: {
        front: {
          file: 'bandal-front.svg', anchor: [184.2, 536.4], body: 69,
          legs: { hip: 517.5, overlap: 9, split: 184.3, L: [70, 71], R: [72, 73] },
          arms: {
            L: { lines: [90, 91], side: 'left', bottom: 503.5, pivot: [160, 471] },
            R: { lines: [92, 93], side: 'right', bottom: 503.5, pivot: [208.4, 471] },
          },
          eyes: { L: { hide: [82, 84, 85], c: [174.4, 432.2], w: 6.6 }, R: { hide: [86, 88, 89], c: [194, 432.2], w: 6.6 } },
          face: [76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 'eyeL', 'eyeR'],
          hatParts: range(0, 68),
          turn: {
            surface: 1,
            groups: [
              // [elements, centre x, radius, depth factor]
              [[76, 77, 78, 79, 80, 81], 184.2, 33, 1.25],
              [[82, 83, 84, 85, 'eyeL'], 174.4, 33, 1.05],
              [[86, 87, 88, 89, 'eyeR'], 194, 33, 1.05],
              [[7, 8], 167.2, 33, 1],
              [[9, 10], 201.2, 33, 1],
              [range(14, 64), 184, 17, 1.1],
              [[65], 175.1, 17, 1],
              [[66], 192.6, 17, 1],
              [range(0, 6), 198.5, 17, 1],
              [[75], 184, 33, 1],
              [[90, 91], 160, 33, 1],
              [[92, 93], 208.4, 33, 1],
              [[70, 71], 163, 40, 0.35],
              [[72, 73], 205, 40, 0.35],
            ],
          },
        },
        back: {
          file: 'bandal-back.svg', anchor: [287, 531.6], body: 0,
          legs: { hip: 517, overlap: 9, split: 287 },
          arms: {
            L: { lines: [6], side: 'left', bottom: 503.5, pivot: [263, 471] },
            R: { lines: [7], side: 'right', bottom: 503.5, pivot: [311, 471] },
          },
          face: [],
          hatParts: [...range(1, 5), ...range(8, 24), 26, 27],
          turn: {
            surface: -1,
            groups: [
              [[12], 270.6, 33, 1],
              [[13], 303.2, 33, 1],
              [range(14, 20), 271.3, 17, 1],
              [[10, 26], 278.6, 17, 1],
              [[11, 27], 295.5, 17, 1],
              [[24, 1, 2, 3, 4, 5], 287, 17, 0.4],
              [[25], 286.6, 33, 1.1],
              [[6], 263.7, 33, 1],
              [[7], 310.1, 33, 1],
              [[28], 286.9, 33, 0.3],
            ],
          },
        },
        right: {
          file: 'bandal-right.svg', anchor: [386, 531.3], body: 1,
          side: { hip: 513.5, overlap: 4, shearPivot: 513.5 },
          arm: { lines: [20, 21], pivot: [387, 459] },
          eyes: { R: { hide: [5, 7, 8], c: [401.4, 431.4], w: 4.6 } },
          face: [0, 4, 5, 6, 7, 8, 9, 10, 17, 'eyeR'],
          hatParts: [2, 3, ...range(11, 16), 22, 23, 24, 25],
        },
      },
    },
    kkomi: {
      name: '꼬미',
      px: 1.9,
      frame: { w: 54, h: 64, foot: 60 },
      arm: { len: 10.5, w0: 4.2, w1: 5, line: 0.75 },
      views: {
        front: {
          file: 'kkomi-front.svg', anchor: [192.9, 534.7], body: 0,
          legs: { hip: 530.5, overlap: 3, split: 193, L: [20, 23], R: [21, 22], fixed: [24] },
          arms: {
            L: { lines: [19, 17], side: 'left', bottom: 524.5, pivot: [181.6, 514.6] },
            R: { lines: [25, 18], side: 'right', bottom: 524.5, pivot: [204.3, 514.6] },
          },
          eyes: { L: { hide: [4, 5, 6], c: [186, 497.4], w: 5 }, R: { hide: [7, 8, 9], c: [200, 497.4], w: 5 } },
          face: range(1, 14).concat(['eyeL', 'eyeR']),
          turn: {
            surface: 1,
            groups: [
              [[1, 2, 10, 11, 12, 13], 193, 18, 1.2],
              [[3, 4, 5, 6, 'eyeL'], 186, 18, 1.05],
              [[7, 8, 9, 14, 'eyeR'], 200, 18, 1.05],
              [[15], 178.7, 18, 0.25],
              [[16], 207, 18, 0.25],
              [[26], 193, 12, 1],
              [[19, 17], 182.5, 12, 1],
              [[25, 18], 203, 12, 1],
              [[20, 23], 184.5, 16, 0.35],
              [[21, 22], 201, 16, 0.35],
            ],
          },
        },
        back: {
          file: 'kkomi-back.svg', anchor: [287, 534.7], body: 4,
          legs: { hip: 530.5, overlap: 3, split: 287, fixed: [6] },
          arms: {
            L: { lines: [2], side: 'left', bottom: 524.5, pivot: [275.4, 514.6] },
            R: { lines: [3], side: 'right', bottom: 524.5, pivot: [298.4, 514.6] },
          },
          face: [],
          turn: {
            surface: -1,
            groups: [
              [[0], 272.6, 18, 1],
              [[1], 301, 18, 1],
              [[5], 286.8, 12, 1.1],
              [[2], 277.3, 12, 1],
              [[3], 296.4, 12, 1],
              [[6], 287, 12, 0.3],
            ],
          },
        },
        right: {
          file: 'kkomi-right.svg', anchor: [386.5, 534.2], body: 10,
          head: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'eyeR'],
          side: { hip: 529, overlap: 2.5, shearPivot: 529 },
          arm: { lines: [13, 14], pivot: [385.3, 511.2] },
          eyes: { R: { hide: [3, 4, 5], c: [396, 496.3], w: 3.6 } },
          face: [0, 2, 3, 4, 5, 8, 9, 'eyeR'],
        },
      },
    },
  };

  // Directions → which view, and how far it turns (+ = towards screen right).
  const DIRS = {
    s: { view: 'front', turn: 0 },
    se: { view: 'front', turn: 1 },
    e: { view: 'right', turn: 0 },
    ne: { view: 'back', turn: 1 },
    n: { view: 'back', turn: 0 },
    nw: { view: 'back', turn: -1 },
    w: { view: 'right', turn: 0, mirror: true },
    sw: { view: 'front', turn: -1 },
  };
  const TURN = 0.3; // radians of head/body turn in the three-quarter views

  // ----------------------------------------------------------- loading
  const views = {}; // `${char}/${view}` → prepared view

  function load(char, viewName, text) {
    const rig = RIGS[char];
    const v = rig.views[viewName];
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:-10000px;top:0';
    host.innerHTML = text;
    document.body.appendChild(host);
    const svg = host.querySelector('svg');
    const [vx, vy, vw, vh] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    const el = (i) => svg.querySelector(`[data-i="${i}"]`);
    const sample = (ids) => {
      const pts = [];
      for (const i of ids) {
        const p = el(i);
        const n = Math.max(40, Math.ceil(p.getTotalLength() * 4));
        const len = p.getTotalLength();
        for (let k = 0; k <= n; k++) { const q = p.getPointAtLength((len * k) / n); pts.push([q.x, q.y]); }
      }
      return pts;
    };
    // Closed eyes: a soft downward arc where each open eye was.
    for (const [side, e] of Object.entries(v.eyes || {})) {
      const p = document.createElementNS(NS, 'path');
      const [cx, cy] = e.c, hw = e.w / 2;
      p.setAttribute('d', `M ${cx - hw} ${cy - 0.4} Q ${cx} ${cy + hw * 0.75} ${cx + hw} ${cy - 0.4}`);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', '#231f20');
      p.setAttribute('stroke-width', String(Math.max(0.7, e.w * 0.16)));
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('data-i', 'eye' + side);
      // Draw it right after the last element of that eye.
      const after = el(Math.max(...e.hide));
      const top = topChild(svg, after);
      top.after(p);
    }
    const prep = { char, name: viewName, rig: v, svg, box: [vx, vy, vw, vh], arms: {} };
    // Arm regions: everything outside the arm's contour line (front/back),
    // or the inside of the arm loop (side).
    for (const [k, a] of Object.entries(v.arms || {})) {
      const pts = sample(a.lines);
      const top = Math.min(...pts.map((p) => p[1]));
      const bins = new Map();
      for (const [x, y] of pts) {
        const b = Math.round(y * 2) / 2;
        const cur = bins.get(b);
        bins.set(b, cur == null ? x : a.side === 'left' ? Math.max(cur, x) : Math.min(cur, x));
      }
      const edge = [...bins.entries()].sort((p, q) => p[0] - q[0]).map(([y, x]) => [x, y]);
      const outer = a.side === 'left' ? vx - 20 : vx + vw + 20;
      const last = edge[edge.length - 1];
      const poly = [[outer, top], ...edge, [last[0], a.bottom], [outer, a.bottom]];
      // The hole cut in the torso is the same region nudged outwards, so the
      // resting arm overlaps a sliver of torso and no seam shows.
      const nudge = a.side === 'left' ? -1.1 : 1.1;
      prep.arms[k] = { poly, hole: poly.map(([x, y]) => [x + nudge, y]), pivot: a.pivot };
    }
    if (v.arm) {
      const pts = sample(v.arm.lines);
      const hull = convexHull(pts);
      const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length;
      const cy = hull.reduce((s, p) => s + p[1], 0) / hull.length;
      const grow = (d) => hull.map(([x, y]) => { const l = Math.hypot(x - cx, y - cy) || 1; return [x + ((x - cx) / l) * d, y + ((y - cy) / l) * d]; });
      prep.loopArm = { poly: grow(1.4), hole: grow(0.4), pivot: v.arm.pivot };
    }
    views[`${char}/${viewName}`] = prep;
    host.remove();
    return prep;
  }

  function topChild(svg, node) {
    let n = node;
    while (n.parentNode && n.parentNode !== svg) n = n.parentNode;
    return n;
  }

  function convexHull(points) {
    const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
    for (const q of p.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
    return lower.slice(0, -1).concat(upper.slice(0, -1));
  }

  // ------------------------------------------------------------ frames
  const f2 = (n) => Math.round(n * 1000) / 1000;
  const polyD = (pts) => 'M ' + pts.map((p) => p.map(f2).join(' ')).join(' L ') + ' Z';
  let uid = 0;

  // Build one layer: a copy of the view keeping only `keep(id)` shapes,
  // each turned group wrapped in its own transform, the whole clipped.
  function layer(prep, keep, { clip, clipRule, transform, filter, turn = 0, faceDy = 0, hatDy = 0, eyes = 'open' } = {}) {
    const v = prep.rig;
    const g = document.createElementNS(NS, 'g');
    const inner = document.createElementNS(NS, 'g');
    if (clip) inner.setAttribute('clip-path', `url(#${clip})`);
    g.appendChild(inner);
    if (transform) g.setAttribute('transform', transform);
    if (filter) g.setAttribute('filter', `url(#${filter})`);
    const hidden = new Set();
    for (const e of Object.values(v.eyes || {})) (eyes === 'open' ? [] : e.hide).forEach((i) => hidden.add(String(i)));
    const closedEye = (id) => typeof id === 'string' && id.startsWith('eye');
    // id → wrapper transform for turned groups
    const shift = new Map();
    if (turn && v.turn) {
      const a = TURN * turn * v.turn.surface;
      for (const [ids, cx0, R, depth] of v.turn.groups) {
        const ax = prep.rig.anchor[0];
        const x = cx0 - ax;
        const phi = Math.asin(Math.max(-0.98, Math.min(0.98, x / R)));
        const dx = R * depth * (Math.sin(phi + a) - Math.sin(phi));
        const sx = Math.max(0.35, Math.cos(phi + a) / Math.cos(phi));
        for (const id of ids) shift.set(String(id), `translate(${f2(cx0 + dx)} 0) scale(${f2(sx)} 1) translate(${f2(-cx0)} 0)`);
      }
    }
    const faceSet = new Set((v.face || []).map(String));
    const hatSet = new Set((v.hatParts || []).map(String));
    for (const child of prep.svg.children) {
      if (child.tagName === 'defs') continue;
      const ids = child.hasAttribute('data-i') ? [child.getAttribute('data-i')] : [...child.querySelectorAll('[data-i]')].map((n) => n.getAttribute('data-i'));
      if (!ids.length) continue;
      const id = ids[0];
      if (!ids.every((i) => keep(i))) continue;
      if (ids.some((i) => hidden.has(i))) continue;
      if (closedEye(id) && eyes === 'open') continue;
      let node = child.cloneNode(true);
      const tr = [];
      if (shift.has(id)) tr.push(shift.get(id));
      if (faceDy && faceSet.has(id)) tr.unshift(`translate(0 ${faceDy})`);
      if (hatDy && hatSet.has(id)) tr.unshift(`translate(0 ${hatDy})`);
      if (tr.length) {
        const w = document.createElementNS(NS, 'g');
        w.setAttribute('transform', tr.join(' '));
        w.appendChild(node);
        node = w;
      }
      inner.appendChild(node);
    }
    return g;
  }

  // pose: {
  //   dir, bob, lean, breathe,
  //   legL/legR: {dy, sy}, (front/back)   near/far: {shear, dy} (side)
  //   armL/armR: degrees (front/back), arm: degrees (side), sit: 'front'|'back'|null,
  //   eyes: 'open'|'closed', faceDy, hatDy, hideLegs
  // }
  function frameSVG(char, pose) {
    const rig = RIGS[char];
    const d = DIRS[pose.dir];
    const prep = views[`${char}/${d.view}`];
    const v = prep.rig;
    const [ax, gy] = v.anchor;
    const { w, h, foot } = rig.frame;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('viewBox', `${f2(ax - w / 2)} ${f2(gy - foot)} ${w} ${h}`);
    svg.setAttribute('width', String(Math.round(w * rig.px)));
    svg.setAttribute('height', String(Math.round(h * rig.px)));
    const defs = prep.svg.querySelector('defs').cloneNode(true);
    svg.appendChild(defs);
    const addClip = (dpath, rule) => {
      const id = `rc${uid++}`;
      const c = document.createElementNS(NS, 'clipPath');
      c.id = id;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', dpath);
      if (rule) p.setAttribute('clip-rule', rule);
      c.appendChild(p);
      defs.appendChild(c);
      return id;
    };
    const darken = `dk${uid++}`;
    defs.insertAdjacentHTML('beforeend', `<filter id="${darken}" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="0.8"/><feFuncG type="linear" slope="0.8"/><feFuncB type="linear" slope="0.8"/></feComponentTransfer></filter>`);
    const [bx, by, bw, bh] = prep.box;
    const X0 = bx - 40, X1 = bx + bw + 40, Y0 = by - 40, Y1 = by + bh + 40;
    const rect = (x0, y0, x1, y1) => `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
    const opts = { turn: d.turn, faceDy: pose.faceDy || 0, hatDy: pose.hatDy || 0, eyes: pose.eyes || 'open' };
    const body = String(v.body);
    const root = document.createElementNS(NS, 'g');
    const sitDrop = pose.sitDrop || 0;
    const t = [`translate(${f2(ax)} ${f2(gy + (pose.bob || 0) + sitDrop)})`];
    if (d.mirror) t.push('scale(-1 1)');
    if (pose.lean) t.push(`rotate(${f2(pose.lean)})`);
    t.push(`translate(${f2(-ax)} ${f2(-gy)})`);
    root.setAttribute('transform', t.join(' '));
    svg.appendChild(root);

    const breathe = pose.breathe ? `translate(0 ${f2(gy)}) scale(1 ${f2(1 + pose.breathe)}) translate(0 ${f2(-gy)})` : '';

    if (v.legs) {
      // ---- front / back: two legs that lift, a torso, two arms.
      const L = v.legs;
      const legIds = new Set([...(L.L || []), ...(L.R || [])].map(String));
      const fixedIds = new Set((L.fixed || []).map(String));
      const armLineIds = new Set();
      const movedArms = [];
      for (const k of ['L', 'R']) {
        const deg = pose['arm' + k];
        if (deg != null && v.arms && v.arms[k]) { movedArms.push(k); v.arms[k].lines.forEach((i) => armLineIds.add(String(i))); }
      }
      if (!pose.hideLegs) {
        for (const k of ['L', 'R']) {
          const lg = pose['leg' + k] || {};
          const x0 = k === 'L' ? X0 : L.split, x1 = k === 'L' ? L.split : X1;
          const clip = addClip(rect(x0, L.hip - L.overlap, x1, Y1));
          const own = new Set([body, ...(L[k] || []).map(String)]);
          const sy = lg.sy || 1;
          const tr = `translate(${f2(lg.dx || 0)} ${f2(lg.dy || 0)}) translate(0 ${f2(L.hip)}) scale(1 ${f2(sy)}) translate(0 ${f2(-L.hip)})`;
          root.appendChild(layer(prep, (i) => own.has(i), { ...opts, clip, transform: tr }));
        }
      }
      // torso (minus the legs below the hip, minus any arm that moves)
      let dpath = rect(X0, Y0, X1, L.hip);
      for (const k of movedArms) dpath += ' ' + polyD(prep.arms[k].hole);
      const torsoClip = addClip(dpath, 'evenodd');
      const torso = layer(prep, (i) => !legIds.has(i) && !armLineIds.has(i) && !fixedIds.has(i), { ...opts, clip: torsoClip, transform: breathe });
      root.appendChild(torso);
      if (fixedIds.size) root.appendChild(layer(prep, (i) => fixedIds.has(i), { ...opts, transform: breathe }));
      // A moved arm is a whole limb: a rounded, body-coloured arm of the
      // character's own proportions, outlined (like the drawn arm contour)
      // only where it lies over the body, never against the background.
      const bodyEl = prep.svg.querySelector(`[data-i="${body}"]`);
      const lineEl = prep.svg.querySelector(`[data-i="${v.arms ? Object.values(v.arms)[0].lines[0] : body}"]`);
      for (const k of movedArms) {
        const arm = prep.arms[k];
        const [px, py] = arm.pivot;
        const { len, w0, w1, line } = rig.arm;
        const a = w0 / 2, b = w1 / 2, r = b;
        const dArm = `M ${-a} ${-a} Q ${-a} ${-a - 1} 0 ${-a - 1} Q ${a} ${-a - 1} ${a} ${-a}`
          + ` C ${a + 0.6} ${len * 0.35} ${b + 0.4} ${len * 0.6} ${b} ${len - r}`
          + ` A ${r} ${r} 0 0 1 ${-b} ${len - r}`
          + ` C ${-b - 0.4} ${len * 0.6} ${-a - 0.6} ${len * 0.35} ${-a} ${-a} Z`;
        const tr = `translate(${px} ${py}) rotate(${f2(pose['arm' + k])})`;
        const g = document.createElementNS(NS, 'g');
        if (breathe) g.setAttribute('transform', breathe);
        const fill = document.createElementNS(NS, 'path');
        fill.setAttribute('d', dArm);
        fill.setAttribute('transform', tr);
        fill.setAttribute('fill', bodyEl.getAttribute('fill'));
        g.appendChild(fill);
        // outline, clipped to the torso that is still there
        const sil = addClip(bodyEl.getAttribute('d'));
        const outer = document.createElementNS(NS, 'g');
        outer.setAttribute('clip-path', `url(#${torsoClip})`);
        const inner = document.createElementNS(NS, 'g');
        inner.setAttribute('clip-path', `url(#${sil})`);
        const stroke = document.createElementNS(NS, 'path');
        stroke.setAttribute('d', dArm);
        stroke.setAttribute('transform', tr);
        stroke.setAttribute('fill', 'none');
        stroke.setAttribute('stroke', lineEl.getAttribute('fill'));
        stroke.setAttribute('stroke-width', String(line));
        stroke.setAttribute('stroke-linejoin', 'round');
        inner.appendChild(stroke);
        outer.appendChild(inner);
        g.appendChild(outer);
        root.appendChild(g);
      }
    } else {
      // ---- side: far leg (shaded), torso, arm loop, near leg; optional separate head.
      const S = v.side;
      const legClip = () => addClip(rect(X0, S.hip - S.overlap, X1, Y1));
      const shear = (sh, dy) => {
        const k = Math.tan((sh * Math.PI) / 180);
        return `translate(0 ${f2(dy || 0)}) translate(${f2(ax)} ${S.shearPivot}) matrix(1 0 ${f2(k)} 1 0 0) translate(${f2(-ax)} ${-S.shearPivot})`;
      };
      const armIds = new Set((v.arm ? v.arm.lines : []).map(String));
      const headIds = new Set((v.head || []).map(String));
      const legsOnly = (i) => i === body;
      if (!pose.hideLegs) {
        const far = pose.far || {};
        root.appendChild(layer(prep, legsOnly, { ...opts, clip: legClip(), transform: shear(far.shear || 0, far.dy), filter: darken }));
      }
      const moveArm = pose.arm != null && prep.loopArm;
      // The arm lies inside the body outline, so the torso keeps its shape
      // under it: only the arm's lines leave with the arm.
      const torsoClip = addClip(rect(X0, Y0, X1, S.hip));
      const headDy = pose.headDy || 0;
      root.appendChild(layer(prep, (i) => !armIds.has(i) && !headIds.has(i), { ...opts, clip: torsoClip, transform: breathe }));
      if (headIds.size) root.appendChild(layer(prep, (i) => headIds.has(i), { ...opts, transform: `${breathe} translate(0 ${f2(headDy)})` }));
      if (moveArm) {
        const arm = prep.loopArm;
        const own = new Set([body, ...v.arm.lines.map(String)]);
        root.appendChild(layer(prep, (i) => own.has(i), { ...opts, clip: addClip(polyD(arm.poly)), transform: `${breathe} rotate(${f2(pose.arm)} ${arm.pivot[0]} ${arm.pivot[1]})` }));
      }
      if (!pose.hideLegs) {
        const near = pose.near || {};
        root.appendChild(layer(prep, legsOnly, { ...opts, clip: legClip(), transform: shear(near.shear || 0, near.dy) }));
      }
    }
    return new XMLSerializer().serializeToString(svg);
  }

  // -------------------------------------------------------- animations
  // Each returns the pose for frame f of n. Values are in source units /
  // degrees and scale with the character (k = rig size factor).
  const TAU = Math.PI * 2;
  const ANIMS = {
    // Walk: 8 frames, one full stride (two steps). Driven by distance.
    walk: {
      frames: 8, fps: 12, dirs: Object.keys(DIRS),
      pose(f, n, dir, k) {
        const ph = (TAU * f) / n;
        const s = Math.sin(ph), c = Math.cos(ph);
        if (DIRS[dir].view === 'right') {
          // Amplitudes are larger than life: in the office a bear is ~45 px tall.
          return {
            bob: -2.4 * k * Math.abs(c), lean: 3 * (DIRS[dir].mirror ? -1 : 1),
            near: { shear: 27 * s, dy: -4.2 * k * Math.max(0, c) },
            far: { shear: -27 * s, dy: -4.2 * k * Math.max(0, -c) },
            arm: 22 * s,
          };
        }
        return {
          bob: -2.4 * k * Math.abs(s), lean: 3.4 * s,
          legL: { dy: -6.5 * k * Math.max(0, s) },
          legR: { dy: -6.5 * k * Math.max(0, -s) },
        };
      },
    },
    // Standing idle: breathing, one blink.
    idle: {
      frames: 6, dirs: Object.keys(DIRS), durations: [260, 260, 260, 260, 1400, 110],
      pose(f) {
        const b = [0, 0.006, 0.012, 0.006, 0, 0][f];
        return { breathe: b, eyes: f === 5 ? 'closed' : 'open' };
      },
    },
    // Sitting at a desk / on a couch.
    sit: {
      frames: 4, dirs: ['s', 'n', 'sw', 'ne', 'se', 'nw'], durations: [500, 500, 1800, 110],
      pose(f, n, dir, k, rig) {
        return { ...sitBase(dir, k, rig), breathe: [0, 0.01, 0, 0][f], eyes: f === 3 ? 'closed' : 'open' };
      },
    },
    // Typing: paws on the keyboard, tapping.
    type: {
      frames: 4, fps: 9, dirs: ['sw', 'ne', 's', 'n'],
      pose(f, n, dir, k, rig) {
        const tap = [0, 1, 0, -1][f];
        return {
          ...sitBase(dir, k, rig),
          armL: -28 + tap * 7,
          armR: 28 + tap * 7,
          bob: -0.3 * k * Math.abs(tap),
        };
      },
    },
    // Waving for attention (waiting for you / error).
    wave: {
      frames: 6, fps: 8, dirs: ['sw', 'ne', 's', 'n'],
      pose(f, n) {
        const w = Math.sin((TAU * f) / n);
        return { armR: -150 + 20 * w, lean: -1.5 * w };
      },
    },
    // Napping: slumped, eyes shut, slow breath.
    nap: {
      frames: 4, dirs: ['sw', 'ne', 's', 'n'], durations: [700, 700, 700, 700],
      pose(f, n, dir, k, rig) {
        const b = [0, 0.014, 0.022, 0.012][f];
        return { ...sitBase(dir, k, rig), breathe: b, eyes: 'closed', faceDy: 1.6 * k, hatDy: 1.4 * k };
      },
    },
    // Holding a cup / phone / book at the chest.
    hold: {
      frames: 4, dirs: ['s', 'n'], durations: [900, 900, 500, 900],
      pose(f) {
        const sip = f === 2;
        return { armR: sip ? 118 : 72, breathe: [0, 0.008, 0.004, 0][f] };
      },
    },
    // Reaching up: whiteboard, arcade buttons, a high shelf.
    reach: {
      frames: 4, fps: 6, dirs: ['n', 's'],
      pose(f) {
        const w = [0, 1, 0, -1][f];
        return { armR: -138 + 12 * w };
      },
    },
  };

  function sitBase(dir, k, rig) {
    // The anchor of a sitting frame is the seat: drop the body by the leg
    // length so the hip lands on the ground line.
    const v = RIGS[rig].views[DIRS[dir].view];
    const hip = v.legs ? v.legs.hip : v.side.hip;
    const drop = v.anchor[1] - hip;
    if (DIRS[dir].view === 'back') return { legL: { sy: 0.3 }, legR: { sy: 0.3 }, sitDrop: drop };
    return { legL: { sy: 0.4 }, legR: { sy: 0.4 }, sitDrop: drop };
  }

  // ------------------------------------------------------------- sheet
  async function buildSheet(char) {
    const rig = RIGS[char];
    const k = rig.frame.h / 158; // pose amplitudes were tuned on Bandal
    const fw = Math.round(rig.frame.w * rig.px), fh = Math.round(rig.frame.h * rig.px);
    const rows = [];
    for (const [anim, A] of Object.entries(ANIMS)) {
      for (const dir of A.dirs) rows.push({ anim, dir, A });
    }
    const cols = Math.max(...Object.values(ANIMS).map((A) => A.frames));
    const canvas = document.createElement('canvas');
    canvas.width = cols * fw;
    canvas.height = rows.length * fh;
    const ctx = canvas.getContext('2d');
    const manifest = {
      id: char, name: rig.name, frameWidth: fw, frameHeight: fh,
      anchor: [Math.round((rig.frame.w / 2) * rig.px), Math.round(rig.frame.foot * rig.px)],
      anims: {},
    };
    const [ancX, ancY] = manifest.anchor;
    for (let r = 0; r < rows.length; r++) {
      const { anim, dir, A } = rows[r];
      const hands = [];
      for (let f = 0; f < A.frames; f++) {
        const pose = { dir, ...A.pose(f, A.frames, dir, k, char) };
        const text = frameSVG(char, pose);
        const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
        const img = new Image();
        img.src = url;
        await img.decode();
        ctx.drawImage(img, f * fw, r * fh, fw, fh);
        URL.revokeObjectURL(url);
        // Where the lifted right paw is, for props (a cup, a phone) the
        // office draws in the paw. Pixels from the anchor.
        const v = rig.views[DIRS[dir].view];
        const arm = v.arms && v.arms.R;
        if (pose.armR != null && arm && !DIRS[dir].mirror) {
          const th = (pose.armR * Math.PI) / 180, l = rig.arm.len - rig.arm.w1 / 2;
          const hx = arm.pivot[0] - l * Math.sin(th) - v.anchor[0];
          const hy = arm.pivot[1] + l * Math.cos(th) + (pose.bob || 0) + (pose.sitDrop || 0) - v.anchor[1];
          hands.push([Math.round(hx * rig.px), Math.round(hy * rig.px)]);
        }
      }
      // Top of the figure in this row (first frame), for name tags and bubbles.
      const px = ctx.getImageData(0, r * fh, fw, fh).data;
      let top = 0;
      outer: for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (px[(y * fw + x) * 4 + 3] > 40) { top = y; break outer; }
      const entry = (manifest.anims[anim] = manifest.anims[anim] || { frames: A.frames, dirs: {}, tops: {} });
      if (A.durations) entry.durations = A.durations;
      else entry.fps = A.fps;
      entry.dirs[dir] = r;
      entry.tops[dir] = ancY - top;
      if (hands.length === A.frames) (entry.hands = entry.hands || {})[dir] = hands;
    }
    manifest.height = manifest.anims.idle.tops.s;
    // Widest point of the standing front view, for the floor shadow.
    {
      const r = manifest.anims.idle.dirs.s;
      const px = ctx.getImageData(0, r * fh, fw, fh).data;
      let x0 = fw, x1 = 0;
      for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (px[(y * fw + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
      manifest.width = x1 - x0 + 1;
    }
    return { png: canvas.toDataURL('image/png'), manifest };
  }

  window.Rig = { RIGS, DIRS, ANIMS, load, frameSVG, buildSheet };
})();
