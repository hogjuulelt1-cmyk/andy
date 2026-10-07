/* Small QR code encoder: byte mode, error correction M, versions 1-9 (up to 179 bytes).
   QR.matrix(text) → array of rows of 0/1 (or null when too long) · QR.svg(text) → <svg> markup, black on white with a quiet zone. */
(function () {
  // per version: [total codewords, ec codewords per block, blocks in group 1, data per block, blocks in group 2, data per block]
  const V = [null, [26, 10, 1, 16, 0, 0], [44, 16, 1, 28, 0, 0], [70, 26, 1, 44, 0, 0], [100, 18, 2, 32, 0, 0], [134, 24, 2, 43, 0, 0], [172, 16, 4, 27, 0, 0], [196, 18, 4, 31, 0, 0], [242, 22, 2, 38, 2, 39], [292, 22, 3, 36, 2, 37]];
  const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46]];
  const EXP = new Array(512), LOG = new Array(256);
  { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; }
  const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
  const GEN = {};
  function gen(n) { if (GEN[n]) return GEN[n]; let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return (GEN[n] = g); }
  function ecc(data, n) { const g = gen(n); const r = new Array(n).fill(0); for (const b of data) { const f = b ^ r.shift(); r.push(0); if (f) for (let i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f); } return r; }
  const dataCw = (v) => V[v][2] * V[v][3] + V[v][4] * V[v][5];
  const MASKS = [(r, c) => (r + c) % 2 === 0, (r, c) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0, (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0, (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => ((((r + c) % 2) + ((r * c) % 3)) % 2) === 0];

  function format(q, N, mask) {
    const data = mask; let rem = data; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412; const b = (i) => (bits >>> i) & 1;
    for (let i = 0; i <= 5; i++) q[i][8] = b(i); q[7][8] = b(6); q[8][8] = b(7); q[8][7] = b(8); for (let i = 9; i < 15; i++) q[8][14 - i] = b(i);
    for (let i = 0; i < 8; i++) q[8][N - 1 - i] = b(i); for (let i = 8; i < 15; i++) q[N - 15 + i][8] = b(i); q[N - 8][8] = 1;
  }
  function penalty(q, N) {
    let p = 0, dark = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { dark += q[r][c]; if (r + 1 < N && c + 1 < N && q[r][c] === q[r][c + 1] && q[r][c] === q[r + 1][c] && q[r][c] === q[r + 1][c + 1]) p += 3; }
    const lines = []; for (let r = 0; r < N; r++) { lines.push(q[r].join("")); let s = ""; for (let c = 0; c < N; c++) s += q[c][r]; lines.push(s); }
    for (const s of lines) {
      const runs = s.match(/0+|1+/g) || []; for (const x of runs) if (x.length >= 5) p += 3 + (x.length - 5);
      for (const pat of ["10111010000", "00001011101"]) { let i = -1; while ((i = s.indexOf(pat, i + 1)) >= 0) p += 40; }
    }
    p += Math.floor(Math.abs((dark * 100) / (N * N) - 50) / 5) * 10; return p;
  }
  function matrix(text) {
    const bytes = Array.from(new TextEncoder().encode(String(text))); let ver = 0;
    for (let v = 1; v <= 9; v++) if (bytes.length + 2 <= dataCw(v)) { ver = v; break; } if (!ver) return null;
    const bits = []; const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8)); const cap = dataCw(ver) * 8; put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
    for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) put(p, 8);
    const cw = []; for (let i = 0; i < bits.length; i += 8) { let x = 0; for (let j = 0; j < 8; j++) x = x * 2 + bits[i + j]; cw.push(x); }
    const [, eccN, n1, d1, n2, d2] = V[ver]; const blocks = []; let pos = 0;
    for (let i = 0; i < n1 + n2; i++) { const len = i < n1 ? d1 : d2; const d = cw.slice(pos, pos + len); pos += len; blocks.push({ d, e: ecc(d, eccN) }); }
    const out = []; for (let i = 0; i < Math.max(d1, d2); i++) for (const b of blocks) if (i < b.d.length) out.push(b.d[i]); for (let i = 0; i < eccN; i++) for (const b of blocks) out.push(b.e[i]);
    const N = ver * 4 + 17; const m = Array.from({ length: N }, () => new Array(N).fill(0)); const fn = Array.from({ length: N }, () => new Array(N).fill(false));
    const set = (r, c, v) => { m[r][c] = v ? 1 : 0; fn[r][c] = true; };
    const finder = (r0, c0) => { for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) { const r = r0 + dr, c = c0 + dc; if (r < 0 || c < 0 || r >= N || c >= N) continue; const inB = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6; set(r, c, inB && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4))); } };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    for (let i = 8; i < N - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const al = ALIGN[ver]; for (const r of al) for (const c of al) { if ((r === 6 && c === 6) || (r === 6 && c === N - 7) || (r === N - 7 && c === 6)) continue; for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1); }
    for (let i = 0; i < 9; i++) { fn[8][i] = true; fn[i][8] = true; } for (let i = 0; i < 8; i++) { fn[8][N - 1 - i] = true; fn[N - 1 - i][8] = true; } fn[N - 8][8] = true;
    if (ver >= 7) { let rem = ver; for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25); const vb = (ver << 12) | rem; for (let i = 0; i < 18; i++) { const bit = (vb >>> i) & 1; const a = N - 11 + (i % 3), b = Math.floor(i / 3); set(b, a, bit); set(a, b, bit); } }
    let idx = 0; const total = out.length * 8;
    for (let right = N - 1; right >= 1; right -= 2) { if (right === 6) right = 5; for (let vert = 0; vert < N; vert++) for (let j = 0; j < 2; j++) { const c = right - j; const up = ((right + 1) & 2) === 0; const r = up ? N - 1 - vert : vert; if (!fn[r][c] && idx < total) { m[r][c] = (out[idx >>> 3] >>> (7 - (idx & 7))) & 1; idx++; } } }
    let best = null, bp = Infinity;
    for (let k = 0; k < 8; k++) { const q = m.map((row) => row.slice()); for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!fn[r][c] && MASKS[k](r, c)) q[r][c] ^= 1; format(q, N, k); const p = penalty(q, N); if (p < bp) { bp = p; best = q; } }
    return best;
  }
  function svg(text) {
    const q = matrix(text); if (!q) return ""; const n = q.length, z = 4; let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q[r][c]) d += "M" + (c + z) + " " + (r + z) + "h1v1h-1z";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + 2 * z) + " " + (n + 2 * z) + '" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  window.QR = { matrix, svg };
})();
