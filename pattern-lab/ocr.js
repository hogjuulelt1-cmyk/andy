// Reads the "LAST 500" statistics grid of a roulette game from screenshots.
// Pure functions over ImageData-like objects ({ width, height, data }), so the same code runs
// in the page (canvas) and in Node tests. Digits are recognised by comparing glyph bitmaps with
// templates learned from real screenshots (digits.json); no network, no OCR engine.
(function (root) {
  'use strict';

  const px = (img, x, y) => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
  const lum = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  // Cell borders are a mid grey; digits are white, red or green on near-black; hits are gold or pink.
  const isBorder = c => Math.abs(c[0] - c[1]) < 16 && Math.abs(c[1] - c[2]) < 16 && c[0] > 70 && c[0] < 160;
  const isGold = c => c[0] > 120 && c[1] > 100 && c[2] < 130 && c[0] - c[2] > 70 && c[0] - c[1] < 60;
  const isPink = c => c[0] > 140 && c[1] < 175 && c[2] < 180 && c[0] - c[1] > 60 && Math.abs(c[1] - c[2]) < 30;
  const isWhite = c => lum(c) > 200 && Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 70;
  const isRedText = c => c[0] > 140 && c[1] < 100 && c[2] < 100;
  const isGreenText = c => c[1] > 110 && c[0] < 110 && c[2] < 120 && c[1] - c[0] > 50;
  const darkCellInk = c => lum(c) > 150 || isRedText(c) || isGreenText(c);
  const MULTS = [50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000];

  // Runs of consecutive indices where flags[i] is true, as [start, end] pairs.
  function runs(flags) {
    const out = [];
    let s = -1;
    for (let i = 0; i <= flags.length; i++) {
      const on = i < flags.length && flags[i];
      if (on && s < 0) s = i;
      if (!on && s >= 0) { out.push([s, i - 1]); s = -1; }
    }
    return out;
  }

  // Finds the grid: rows and columns of bordered cells. Rows cut by the panel edge are kept
  // and flagged partial when their text is still readable.
  function detectGrid(img) {
    const W = img.width, H = img.height;
    const minH = W * 0.035, maxH = W * 0.075;
    const linesIn = (x0, x1, frac) => {
      const hFlag = new Array(H).fill(false);
      for (let y = 0; y < H; y++) {
        let c = 0, n = 0;
        for (let x = x0; x < x1; x += 2) { n++; if (isBorder(px(img, x, y))) c++; }
        hFlag[y] = c > n * frac;
      }
      return runs(hFlag).map(r => (r[0] + r[1]) / 2);
    };
    const pairRows = hLines => {
      const rows = [];
      for (let i = 0; i + 1 < hLines.length; i++) {
        const d = hLines[i + 1] - hLines[i];
        if (d >= minH && d <= maxH) rows.push({ top: hLines[i], bottom: hLines[i + 1] });
      }
      return rows;
    };
    let rows = pairRows(linesIn(Math.floor(W * 0.04), Math.floor(W * 0.9), 0.55));
    if (!rows.length) return null;
    // Vertical lines inside the rows' span.
    const vFlag = new Array(W).fill(false);
    for (let x = 0; x < W; x++) {
      let c = 0, n = 0;
      for (const r of rows) for (let y = Math.floor(r.top + 4); y < r.bottom - 4; y += 2) { n++; if (isBorder(px(img, x, y))) c++; }
      vFlag[x] = n > 0 && c > n * 0.6;
    }
    const vLines = runs(vFlag).map(r => (r[0] + r[1]) / 2);
    const minW = W * 0.04, maxW = W * 0.09;
    const cols = [];
    for (let i = 0; i + 1 < vLines.length; i++) {
      const d = vLines[i + 1] - vLines[i];
      if (d >= minW && d <= maxW) cols.push({ left: vLines[i], right: vLines[i + 1] });
    }
    if (cols.length < 5) return null;
    // Second pass over the grid's own x-span with a low threshold, so a short last row is found too.
    const gx0 = Math.floor(cols[0].left), gx1 = Math.floor(cols[cols.length - 1].right);
    const hLines = linesIn(gx0, gx1, 0.2);
    rows = pairRows(hLines);
    if (!rows.length) return null;
    let cellH = rows[0].bottom - rows[0].top;
    const hasBorder = (r, c) => {
      // The cell exists when its own top (or, for a top-cut row, bottom) border is there.
      const yLine = Math.round(r.cut === 'top' ? r.bottom : r.top);
      let hit = 0, n = 0;
      for (let x = Math.floor(c.left + 4); x < c.right - 4; x += 2) { n++; if (isBorder(px(img, x, yLine))) hit++; }
      return hit > n * 0.5;
    };
    // Columns that most rows use; a stray line at the screen edge is not a column. Rows with
    // fewer than three bordered cells are not grid rows.
    const used = cols.filter(c => rows.filter(r => hasBorder(r, c)).length >= rows.length * 0.5);
    if (used.length < 5) return null;
    rows = rows.filter(r => used.filter(c => hasBorder(r, c)).length >= 3);
    if (!rows.length) return null;
    const heights = rows.map(r => r.bottom - r.top).sort((a, b) => a - b);
    cellH = heights[Math.floor(heights.length / 2)];
    // A row cut at the top edge has only its bottom line, one cell gap above the first full row;
    // one cut at the bottom edge has only its top line, one gap below the last full row.
    const gapMax = cellH * 0.5;
    const before = hLines.filter(y => y < rows[0].top).pop(), after = hLines.find(y => y > rows[rows.length - 1].bottom);
    if (before != null && rows[0].top - before > W * 0.002 && rows[0].top - before < gapMax && before - cellH > 0) rows.unshift({ top: before - cellH, bottom: before, partial: true, cut: 'top' });
    if (after != null && after - rows[rows.length - 1].bottom > W * 0.002 && after - rows[rows.length - 1].bottom < gapMax && after + cellH < H) rows.push({ top: after, bottom: after + cellH, partial: true, cut: 'bottom' });
    const grid = rows.map(r => {
      const cells = [];
      for (const c of used) { if (!hasBorder(r, c)) break; cells.push({ x: c.left, y: r.top, w: c.right - c.left, h: r.bottom - r.top, partial: !!r.partial }); }
      return cells;
    }).filter(cells => cells.length);
    if (!grid.length) return null;
    return { rows: grid, cellW: used[0].right - used[0].left, cellH, left: Math.floor(used[0].left), right: Math.floor(used[used.length - 1].right) };
  }

  // Background class of a cell: 'gold', 'pink' or 'dark', sampled in bands where no text is drawn.
  function cellBackground(img, cell) {
    let gold = 0, pink = 0, n = 0;
    for (const fy of [0.1, 0.14, 0.86, 0.9]) {
      const y = Math.round(cell.y + cell.h * fy);
      if (y < 0 || y >= img.height) continue;
      for (let fx = 0.15; fx <= 0.85; fx += 0.1) {
        const c = px(img, Math.round(cell.x + cell.w * fx), y); n++;
        if (isGold(c)) gold++; else if (isPink(c)) pink++;
      }
    }
    return gold > n * 0.5 ? 'gold' : pink > n * 0.5 ? 'pink' : 'dark';
  }

  // Ink mask of a rectangle (1 = text). Highlighted cells carry white/cream text (the multiplier
  // view outlines it in black, which is ignored); dark cells carry white, red or green text.
  function maskOf(img, x0, y0, w, h, isInk) {
    const m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const sy = y0 + y;
      if (sy < 0 || sy >= img.height) continue;
      for (let x = 0; x < w; x++) {
        const sx = x0 + x;
        if (sx < 0 || sx >= img.width) continue;
        if (isInk(px(img, sx, sy))) m[y * w + x] = 1;
      }
    }
    return m;
  }
  function cellMask(img, cell) {
    const bg = cellBackground(img, cell);
    const x0 = Math.round(cell.x + 4), y0 = Math.round(cell.y + 4), w = Math.round(cell.w - 8), h = Math.round(cell.h - 8);
    return { m: maskOf(img, x0, y0, w, h, bg === 'dark' ? darkCellInk : isWhite), w, h, bg };
  }

  // Connected components (8-connected) of a mask, left to right, with touching bold digits split.
  function components(m, w, h, minHeight) {
    const seen = new Uint8Array(w * h);
    const comps = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!m[i] || seen[i]) continue;
      const stack = [i]; seen[i] = 1;
      let minX = x, maxX = x, minY = y, maxY = y, n = 0;
      while (stack.length) {
        const j = stack.pop(); n++;
        const jx = j % w, jy = (j - jx) / w;
        if (jx < minX) minX = jx; if (jx > maxX) maxX = jx; if (jy < minY) minY = jy; if (jy > maxY) maxY = jy;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = jx + dx, ny = jy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const k = ny * w + nx;
          if (m[k] && !seen[k]) { seen[k] = 1; stack.push(k); }
        }
      }
      comps.push({ minX, maxX, minY, maxY, n });
    }
    const kept = comps.filter(c => c.maxY - c.minY + 1 >= minHeight && c.n >= 12).sort((a, b) => a.minX - b.minX);
    const split = [];
    for (const c of kept) {
      const bw = c.maxX - c.minX + 1, bh = c.maxY - c.minY + 1, k = Math.round(bw / (bh * 0.62));
      if (k < 2) { split.push(c); continue; }
      const colSum = [];
      for (let x = c.minX; x <= c.maxX; x++) { let v = 0; for (let y = c.minY; y <= c.maxY; y++) v += m[y * w + x]; colSum.push(v); }
      let start = c.minX;
      for (let part = 1; part < k; part++) {
        const target = c.minX + Math.round(bw * part / k), span = Math.round(bw / k / 3);
        let bestX = target, bestV = Infinity;
        for (let x = target - span; x <= target + span; x++) { const v = colSum[x - c.minX]; if (v < bestV) { bestV = v; bestX = x; } }
        split.push({ minX: start, maxX: bestX - 1, minY: c.minY, maxY: c.maxY, n: c.n });
        start = bestX;
      }
      split.push({ minX: start, maxX: c.maxX, minY: c.minY, maxY: c.maxY, n: c.n });
    }
    return split.map(c => {
      let minY = c.maxY, maxY = c.minY;
      for (let y = c.minY; y <= c.maxY; y++) for (let x = c.minX; x <= c.maxX; x++) if (m[y * w + x]) { if (y < minY) minY = y; if (y > maxY) maxY = y; break; }
      return Object.assign({}, c, { minY, maxY });
    }).filter(c => c.maxX >= c.minX && c.maxY >= c.minY);
  }

  // A glyph as a fixed-size bitmap (area-sampled bounding box) plus its aspect ratio.
  const GW = 14, GH = 22;
  function glyphBitmap(m, w, c) {
    const bw = c.maxX - c.minX + 1, bh = c.maxY - c.minY + 1;
    const bits = new Float32Array(GW * GH);
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      const sx0 = c.minX + gx * bw / GW, sx1 = c.minX + (gx + 1) * bw / GW, sy0 = c.minY + gy * bh / GH, sy1 = c.minY + (gy + 1) * bh / GH;
      let on = 0, tot = 0;
      for (let y = Math.floor(sy0); y < Math.ceil(sy1); y++) for (let x = Math.floor(sx0); x < Math.ceil(sx1); x++) { tot++; if (m[y * w + x]) on++; }
      bits[gy * GW + gx] = tot ? on / tot : 0;
    }
    return { bits, aspect: bw / bh, x: c.minX, width: bw, height: bh, y: c.minY };
  }
  function cellGlyphs(img, cell) {
    const { m, w, h, bg } = cellMask(img, cell);
    return { bg, glyphs: components(m, w, h, h * 0.18).map(c => glyphBitmap(m, w, c)) };
  }
  const glyphDist = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]); return d / a.length; };

  // Nearest template for one glyph. templates: [{ label, bits, aspect }].
  function classify(gl, templates) {
    let best = null;
    for (const t of templates) {
      // Aspect ratio separates 1 from the wide digits before the bitmap distance decides.
      const d = glyphDist(gl.bits, t.bits) + 0.25 * Math.abs(gl.aspect - t.aspect);
      if (!best || d < best.d) best = { d, label: t.label };
    }
    return best;
  }
  function readGlyphs(glyphs, templates) {
    let text = '', worst = 0;
    for (const gl of glyphs) { const b = classify(gl, templates); if (b) { text += b.label; worst = Math.max(worst, b.d); } }
    return { text, worst };
  }
  function readCell(img, cell, templates) {
    const g = cellGlyphs(img, cell);
    const r = readGlyphs(g.glyphs, templates);
    const hs = g.glyphs.map(gl => gl.height).sort((a, b) => a - b);
    return { text: r.text, bg: g.bg, glyphs: g.glyphs.length, worst: r.worst, gh: hs.length ? hs[Math.floor(hs.length / 2)] : 0 };
  }
  // Templates stored compactly in digits.json: bits as one digit 0–9 per pixel.
  const unpackTemplates = json => json.templates.map(t => ({ label: t.label, aspect: t.aspect, bits: t.bits.split('').map(ch => +ch / 9) }));

  // "100x" → 100, "10007" → 1000 (a misread x); numbers 0–36 stay numbers.
  function parseCellText(text, highlighted) {
    const t = String(text);
    const digits = t.replace(/[^0-9]/g, '');
    if (!digits) return null;
    if (/x/.test(t) || highlighted && digits.length >= 3) {
      // Longest leading digit string that is a known multiplier.
      for (let len = digits.length; len >= 2; len--) { const v = parseInt(digits.slice(0, len), 10); if (MULTS.includes(v)) return { mult: v }; }
      return { mult: parseInt(digits, 10) };
    }
    const v = parseInt(digits, 10);
    return v <= 36 ? { n: v } : { mult: v };
  }

  // The twelve newest results sit in a strip above the grid; it is part of the sequence only when
  // the grid is scrolled to the top (no cut row between the strip and the first full row).
  function readStrip(img, grid, templates) {
    const W = img.width;
    // The tab underline (cyan) marks the top of the panel body.
    let cyanY = -1, bestN = 0;
    const firstRow = grid.rows[0][0];
    for (let y = 0; y < firstRow.y; y++) {
      let n = 0;
      for (let x = 0; x < W; x += 3) { const c = px(img, x, y); if (c[0] < 160 && c[1] > 170 && c[2] > 190) n++; }
      if (n > bestN) { bestN = n; cyanY = y; }
    }
    if (bestN < W / 3 * 0.15) return { atTop: false, items: [] };
    const firstFull = grid.rows.find(cells => !cells[0].partial);
    const gap = (firstFull ? firstFull[0].y : firstRow.y) - cyanY;
    const atTop = !firstRow.partial && gap < W * 0.2;
    if (!atTop) return { atTop, items: [] };
    const y0 = Math.round(cyanY + W * 0.03), y1 = Math.round(firstRow.y - W * 0.008);
    const x0 = 0, x1 = W;
    const w = x1 - x0, h = y1 - y0;
    const m = maskOf(img, x0, y0, w, h, c => isWhite(c) || isRedText(c) || isGreenText(c));
    const comps = components(m, w, h, grid.cellH * 0.18);
    if (!comps.length) return { atTop, items: [] };
    // Digits are about half a cell tall, multiplier labels a third. The newest result sits in a
    // tile (gold, pink or grey) whose outline or fill forms a tall blob; its digits are read
    // from the white pixels inside it.
    const hOf = c => c.maxY - c.minY + 1;
    // Tile pieces (an outline often splits, a pink fill fades out) are merged when they touch;
    // every tile is about 1.45 cells tall.
    const pieces = comps.filter(c => hOf(c) > grid.cellH * 0.8 && c.maxX - c.minX + 1 > grid.cellH * 0.3).sort((a, b) => a.minX - b.minX);
    const tiles = [];
    for (const c of pieces) {
      const t = tiles[tiles.length - 1];
      if (t && c.minX - t.maxX < grid.cellH * 0.15) { t.maxX = Math.max(t.maxX, c.maxX); t.minY = Math.min(t.minY, c.minY); t.maxY = Math.max(t.maxY, c.maxY); }
      else tiles.push({ minX: c.minX, maxX: c.maxX, minY: c.minY, maxY: c.maxY });
    }
    tiles.forEach(t => { t.maxY = Math.min(h - 1, Math.max(t.maxY, Math.round(t.minY + grid.cellH * 1.45))); });
    const inTile = c => tiles.some(t => c.minX >= t.minX && c.maxX <= t.maxX && c.minY >= t.minY && c.maxY <= t.maxY);
    const big = comps.filter(c => hOf(c) >= grid.cellH * 0.4 && hOf(c) <= grid.cellH * 0.8 && !inTile(c)), small = comps.filter(c => hOf(c) < grid.cellH * 0.4);
    for (const t of tiles) {
      const tw = t.maxX - t.minX - 7, th = t.maxY - t.minY - 7;
      if (tw < 10 || th < 10) continue;
      const tm = maskOf(img, x0 + t.minX + 4, y0 + t.minY + 4, tw, th, isWhite);
      components(tm, tw, th, grid.cellH * 0.2)
        .filter(c => hOf(c) < grid.cellH * 0.4)
        .forEach(c => small.push({ minX: c.minX + t.minX + 4, maxX: c.maxX + t.minX + 4, minY: c.minY + t.minY + 4, maxY: c.maxY + t.minY + 4, n: c.n, glyph: glyphBitmap(tm, tw, c) }));
      components(tm, tw, th, grid.cellH * 0.4)
        .filter(c => c.minX > 1 && c.minY > 1 && c.maxX < tw - 2 && c.maxY < th - 2)
        .forEach(c => big.push({ minX: c.minX + t.minX + 4, maxX: c.maxX + t.minX + 4, minY: c.minY + t.minY + 4, maxY: c.maxY + t.minY + 4, n: c.n, tile: t, glyph: glyphBitmap(tm, tw, c) }));
    }
    big.sort((a, b) => a.minX - b.minX);
    const maxH = big.length ? Math.max(...big.map(hOf)) : grid.cellH * 0.5;
    // Digits closer than half a glyph height belong to the same number.
    const items = [];
    for (const c of big) {
      const last = items[items.length - 1];
      if (last && c.minX - last.maxX < maxH * 0.5 && !!last.tile === !!c.tile) { last.comps.push(c); last.maxX = c.maxX; } else items.push({ comps: [c], minX: c.minX, maxX: c.maxX, minY: c.minY, maxY: c.maxY, tile: c.tile });
    }
    return {
      atTop, cyanY, band: [x0, y0, x1, y1], big: big.map(c => [c.minX, c.maxX, c.minY, c.maxY]), small: small.map(c => [c.minX, c.maxX, c.minY, c.maxY]),
      items: items.map(it => {
        const r = readGlyphs(it.comps.map(c => c.glyph || glyphBitmap(m, w, c)), templates);
        const cx = Math.round(x0 + (it.minX + it.maxX) / 2), cy = Math.round(y0 + (it.minY + it.maxY) / 2);
        let light = false;
        if (it.tile) {
          const t = it.tile, tw = t.maxX - t.minX, th = t.maxY - t.minY;
          let hits = 0;
          for (const [fx, fy] of [[0.12, 0.15], [0.88, 0.15], [0.12, 0.5], [0.88, 0.5]]) { const c = px(img, x0 + Math.round(t.minX + tw * fx), y0 + Math.round(t.minY + th * fy)); if (isGold(c) || isPink(c)) hits++; }
          light = hits >= 2;
        }
        // A multiplier label under the number: small glyphs within the number's x-span.
        const under = small.filter(c => c.minY > it.maxY && c.minX >= it.minX - maxH && c.maxX <= it.maxX + maxH).sort((a, b) => a.minX - b.minX);
        const lab = under.length ? parseCellText(readGlyphs(under.map(c => c.glyph || glyphBitmap(m, w, c)), templates).text, true) : null;
        const tok = parseCellText(r.text, false);
        const mult = lab && lab.mult && MULTS.includes(lab.mult) ? lab.mult : null;
        return { n: tok && tok.n != null ? tok.n : null, text: r.text, x: it.minX, light: light || mult != null, mult, worst: r.worst };
      }),
    };
  }

  // One screenshot → its newest-first sequence of cells. view: 'numbers' or 'mult'.
  function readScreen(img, templates) {
    const grid = detectGrid(img);
    if (!grid) return null;
    let cells = [];
    grid.rows.forEach((row, ri) => row.forEach((cell, ci) => {
      const r = readCell(img, cell, templates);
      const tok = parseCellText(r.text, r.bg !== 'dark');
      cells.push({ ri, ci, bg: r.bg, text: r.text, n: tok && tok.n != null ? tok.n : null, mult: tok && tok.mult != null ? tok.mult : null, worst: r.worst, partial: cell.partial, glyphs: r.glyphs, gh: r.gh });
    }));
    // A row cut by the panel edge is kept only when its digits are as tall as everyone else's.
    const fullH = cells.filter(c => !c.partial && c.gh).map(c => c.gh).sort((a, b) => a - b);
    const refH = fullH.length ? fullH[Math.floor(fullH.length / 2)] : 0;
    const badRows = new Set();
    grid.rows.forEach((row, ri) => {
      if (!row[0].partial) return;
      const hs = cells.filter(c => c.ri === ri && c.gh).map(c => c.gh).sort((a, b) => a - b);
      const med = hs.length ? hs[Math.floor(hs.length / 2)] : 0;
      if (!refH || med < refH * 0.85 || cells.filter(c => c.ri === ri && c.n == null && c.mult == null).length > row.length / 3) badRows.add(ri);
    });
    cells = cells.filter(c => !badRows.has(c.ri));
    grid.rows = grid.rows.filter((row, ri) => !badRows.has(ri));
    const highlighted = cells.filter(c => c.bg !== 'dark');
    const view = highlighted.length && highlighted.filter(c => c.mult != null).length > highlighted.length / 2 ? 'mult' : 'numbers';
    const strip = readStrip(img, grid, templates);
    const cols = Math.max(...grid.rows.map(r => r.length));
    return { grid, cells, view, strip, rows: grid.rows.length, cols, shortEnd: grid.rows[grid.rows.length - 1].length < cols };
  }

  // Pairs multiplier views with number views of the same screen (identical plain cells) and
  // returns one newest-first sequence per screen: [{ n, light, mult, sure }].
  function sequences(screens) {
    const numbers = screens.filter(s => s.view === 'numbers'), mults = screens.filter(s => s.view === 'mult');
    const plainKey = s => s.cells.filter(c => c.bg === 'dark').map(c => c.ri + ':' + c.ci + '=' + c.n).join(',');
    const out = [];
    const paired = new Set();
    // The strip (the twelve newest results) is its own short sequence: whether the grid below it
    // starts right after it cannot be told from one screenshot, so the merge decides.
    const stripKeys = new Set();
    const addStrip = s => {
      const items = s.strip.items.filter(it => it.n != null);
      if (items.length < 8) return;
      const key = items.map(it => it.n).join(',');
      if (stripKeys.has(key)) return;
      stripKeys.add(key);
      out.push({ seq: items.map(it => ({ n: it.n, light: it.light, mult: it.mult, sure: it.worst < 0.2 })), isStrip: true });
    };
    for (const s of numbers) {
      const key = plainKey(s);
      const twin = mults.find(m => plainKey(m) === key && m.rows === s.rows);
      if (twin) paired.add(twin);
      const multAt = new Map();
      if (twin) twin.cells.forEach(c => { if (c.bg !== 'dark' && c.mult != null) multAt.set(c.ri + ':' + c.ci, c.mult); });
      addStrip(s);
      const seq = [];
      s.cells.forEach(c => seq.push({ n: c.n, light: c.bg !== 'dark', mult: multAt.get(c.ri + ':' + c.ci) || null, sure: c.n != null && c.worst < 0.2 }));
      out.push({ seq, twin: !!twin, strip: s.strip.items.length, hasEnd: !!s.shortEnd });
    }
    // A multiplier view without its number view still gives the plain cells and the multipliers;
    // the highlighted numbers stay unknown until another screenshot fills them in.
    for (const m of mults) {
      if (paired.has(m)) continue;
      addStrip(m);
      const seq = [];
      m.cells.forEach(c => seq.push(c.bg === 'dark' ? { n: c.n, light: false, mult: null, sure: c.n != null && c.worst < 0.2 } : { n: null, light: true, mult: c.mult, sure: false }));
      out.push({ seq, twin: false, multOnly: true, strip: m.strip.items.length, hasEnd: !!m.shortEnd });
    }
    return out;
  }

  // Merges newest-first sequences that overlap (the same list scrolled, or captured later).
  // Unsure or empty cells match anything. Returns the merged sequence and what was joined.
  function mergeSequences(windows, minOverlap) {
    minOverlap = minOverlap || 8;
    const seqs = windows.map(w => { const a = w.seq.slice(); a.isStrip = !!w.isStrip; a.hasEnd = !!w.hasEnd; a.order = windows.indexOf(w); return a; });
    const eq = (a, b) => a.n == null || b.n == null || !a.sure || !b.sure || a.n === b.n;
    // Longest overlap where b starts inside a (b older than or equal to a's tail).
    const overlap = (a, b) => {
      for (let o = 0; o <= a.length - minOverlap; o++) {
        let ok = true;
        for (let i = 0; o + i < a.length && i < b.length; i++) if (!eq(a[o + i], b[i])) { ok = false; break; }
        if (ok) return { offset: o, len: Math.min(a.length - o, b.length) };
      }
      return null;
    };
    const merge = (a, b, o) => {
      const out = a.slice();
      out.isStrip = a.isStrip && b.isStrip; out.hasEnd = a.hasEnd || b.hasEnd; out.order = Math.min(a.order, b.order);
      for (let i = 0; i < b.length; i++) {
        const j = o + i;
        if (j < out.length) { if (out[j].n == null || !out[j].sure) out[j] = Object.assign({}, b[i], { n: out[j].n != null && out[j].sure ? out[j].n : b[i].n }); if (b[i].mult && !out[j].mult) out[j].mult = b[i].mult; }
        else out.push(b[i]);
      }
      return out;
    };
    const list = seqs.slice();
    const joins = [];
    let changed = true;
    while (changed && list.length > 1) {
      changed = false;
      let best = null;
      for (let i = 0; i < list.length; i++) for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const ov = overlap(list[i], list[j]);
        if (ov && (!best || ov.len > best.len)) best = { i, j, offset: ov.offset, len: ov.len };
      }
      if (best) {
        const merged = merge(list[best.i], list[best.j], best.offset);
        joins.push(best.len);
        list.splice(Math.max(best.i, best.j), 1); list.splice(Math.min(best.i, best.j), 1);
        list.push(merged);
        changed = true;
      }
    }
    // Windows that share nothing (scrolled exactly one screen) are assumed adjacent: a strip is
    // newest, a window ending in a short row is oldest, the rest keep the order given.
    const rank = l => (l.isStrip ? 0 : l.hasEnd ? 2 : 1);
    list.sort((a, b) => rank(a) - rank(b) || a.order - b.order);
    const merged = list.reduce((acc, l) => acc.concat(l), []);
    return { merged, unjoined: list.length - 1, joins };
  }

  const api = { detectGrid, cellBackground, cellMask, cellGlyphs, readCell, classify, readGlyphs, glyphDist, GW, GH, unpackTemplates, parseCellText, readStrip, readScreen, sequences, mergeSequences, MULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PLOCR = api;
})(typeof window !== 'undefined' ? window : globalThis);
