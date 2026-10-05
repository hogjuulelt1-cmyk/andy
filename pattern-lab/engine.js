// Pattern Lab engine: statistics, learning models, simulator and player-psychology analysis.
// Works in the browser (window.PL) and in Node (module.exports) so it can be tested headless.
(function (root) {
  'use strict';

  // ---------- Roulette geometry (European single-zero wheel) ----------
  const N = 37;
  const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const POS = new Array(N);
  WHEEL.forEach((n, i) => { POS[n] = i; });
  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const colorOf = n => (n === 0 ? 'G' : REDS.has(n) ? 'R' : 'B');
  const wheelDist = (a, b) => (POS[b] - POS[a] + N) % N;

  // Outside bets: which numbers each one covers and its total return per unit (stake included).
  const OUTSIDE = {
    red: { ret: 2, has: n => colorOf(n) === 'R' },
    black: { ret: 2, has: n => colorOf(n) === 'B' },
    even: { ret: 2, has: n => n > 0 && n % 2 === 0 },
    odd: { ret: 2, has: n => n % 2 === 1 },
    low: { ret: 2, has: n => n >= 1 && n <= 18 },
    high: { ret: 2, has: n => n >= 19 },
    d1: { ret: 3, has: n => n >= 1 && n <= 12 },
    d2: { ret: 3, has: n => n >= 13 && n <= 24 },
    d3: { ret: 3, has: n => n >= 25 },
    c1: { ret: 3, has: n => n > 0 && n % 3 === 1 },
    c2: { ret: 3, has: n => n > 0 && n % 3 === 2 },
    c3: { ret: 3, has: n => n > 0 && n % 3 === 0 },
  };

  // ---------- Random numbers ----------
  function rng(seed) {
    let a = (seed >>> 0) || 0x9e3779b9;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pickWeighted(p, r) {
    let s = 0, u = r();
    for (let i = 0; i < p.length; i++) { s += p[i]; if (u < s) return i; }
    return p.length - 1;
  }
  function shuffle(arr, r) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------- Special functions / p-values ----------
  function lgamma(x) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    let a = c[0];
    const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  // Regularized upper incomplete gamma Q(s, x).
  function gammaQ(s, x) {
    if (x <= 0) return 1;
    if (x < s + 1) {
      let sum = 1 / s, del = sum, ap = s;
      for (let n = 0; n < 500; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; }
      return Math.max(0, 1 - sum * Math.exp(-x + s * Math.log(x) - lgamma(s)));
    }
    let b = x + 1 - s, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 500; i++) {
      const an = -i * (i - s);
      b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-14) break;
    }
    return Math.min(1, Math.exp(-x + s * Math.log(x) - lgamma(s)) * h);
  }
  const chi2p = (x, df) => gammaQ(df / 2, x / 2);
  function erfc(x) {
    const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
      t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  const normSf = z => 0.5 * erfc(z / Math.SQRT2); // P(Z > z)
  const twoSided = z => Math.min(1, 2 * normSf(Math.abs(z)));
  // P(X >= k) for X ~ Binomial(n, p), summed in log space.
  function binomSf(k, n, p) {
    if (k <= 0) return 1;
    if (k > n) return 0;
    const lp = Math.log(p), lq = Math.log(1 - p), base = lgamma(n + 1);
    let s = 0;
    for (let i = k; i <= n; i++) {
      const lt = base - lgamma(i + 1) - lgamma(n - i + 1) + i * lp + (n - i) * lq;
      s += Math.exp(lt);
      if (i > k + 10 && Math.exp(lt) < s * 1e-15) break;
    }
    return Math.min(1, s);
  }

  // ---------- Data parsing ----------
  // A spin: { n, session, dealer, dir, liab: Float64Array(37) | null }
  // dir: ball launch direction ('A' / 'B') when known. Many automatic wheels alternate it every spin.
  // liab[k] = what the house pays out if k wins (sum over all bets on the table).
  function liabilityFromStakes(stakes) {
    const L = new Float64Array(N);
    let any = false;
    for (let k = 0; k < N; k++) {
      const s = stakes['b' + k];
      if (s) { L[k] += 36 * s; any = true; }
    }
    for (const key in OUTSIDE) {
      const s = stakes[key];
      if (!s) continue;
      any = true;
      const o = OUTSIDE[key];
      for (let k = 0; k < N; k++) if (o.has(k)) L[k] += o.ret * s;
    }
    return any ? L : null;
  }

  function parseDir(v) {
    const t = String(v == null ? '' : v).trim().toLowerCase();
    if (['cw', 'r', 'right', '1', '+', '+1', 'a', 'clockwise'].includes(t)) return 'A';
    if (['ccw', 'acw', 'l', 'left', '-1', '-', '0', 'b', 'counterclockwise', 'anticlockwise'].includes(t)) return 'B';
    return null;
  }
  // Launch direction for every spin: the recorded one, else alternate within the session
  // (the usual behaviour of automatic wheels).
  function directions(spins) {
    const out = new Array(spins.length);
    let k = 0;
    for (let i = 0; i < spins.length; i++) {
      if (i === 0 || spins[i].session !== spins[i - 1].session) k = 0;
      out[i] = spins[i].dir || (k % 2 ? 'B' : 'A');
      k++;
    }
    return out;
  }

  function parseSpins(text) {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    const first = lines.find(l => l.trim()) || '';
    const errors = [];
    const spins = [];
    if (/[a-zа-я]/i.test(first) && /,|;|\t/.test(first)) {
      const sep = first.includes('\t') ? '\t' : first.includes(';') ? ';' : ',';
      const head = first.split(sep).map(h => h.trim().toLowerCase());
      const col = names => head.findIndex(h => names.includes(h));
      const iN = col(['number', 'n', 'result', 'outcome', 'тоо', 'үр дүн']);
      const iS = col(['session', 'сесс', 'session_id', 'table_session']);
      const iD = col(['dealer', 'дилер', 'croupier', 'machine', 'wheel']);
      const iR = col(['direction', 'dir', 'чиглэл', 'spin_direction']);
      if (iN < 0) return { spins, errors: ['Толгой мөрөнд "number" багана олдсонгүй.'] };
      const stakeCols = head.map((h, i) => ({ h, i })).filter(c => /^b([0-9]|[12][0-9]|3[0-6])$/.test(c.h) || OUTSIDE[c.h]);
      const start = lines.indexOf(first) + 1;
      for (let li = start; li < lines.length; li++) {
        const raw = lines[li];
        if (!raw.trim()) continue;
        const cells = raw.split(sep);
        const n = parseInt(cells[iN], 10);
        if (!(n >= 0 && n <= 36)) { errors.push(`${li + 1}-р мөр: "${(cells[iN] || '').trim()}" 0–36 биш.`); continue; }
        const stakes = {};
        stakeCols.forEach(c => { const v = parseFloat(cells[c.i]); if (v > 0) stakes[c.h] = v; });
        spins.push({
          n,
          session: iS >= 0 ? String(cells[iS] || '').trim() || '1' : '1',
          dealer: iD >= 0 ? String(cells[iD] || '').trim() : '',
          dir: iR >= 0 ? parseDir(cells[iR]) : null,
          liab: stakeCols.length ? liabilityFromStakes(stakes) : null,
        });
      }
      return { spins, errors };
    }
    // Plain list: numbers separated by anything; a blank line, '#' or '---' starts a new session.
    let session = 1, sawNumber = false;
    lines.forEach((raw, li) => {
      const line = raw.trim();
      if (!line || line.startsWith('#') || /^-{3,}$/.test(line)) { if (sawNumber) { session++; sawNumber = false; } return; }
      line.split(/[^0-9]+/).filter(Boolean).forEach(tok => {
        const n = parseInt(tok, 10);
        if (n >= 0 && n <= 36) { spins.push({ n, session: String(session), dealer: '', dir: null, liab: null }); sawNumber = true; }
        else errors.push(`${li + 1}-р мөр: "${tok}" 0–36 биш.`);
      });
    });
    return { spins, errors };
  }

  function spinsToCsv(spins) {
    const hasL = spins.some(s => s.liab);
    const hasDir = spins.some(s => s.dir);
    const head = ['number', 'session', 'dealer'];
    if (hasDir) head.push('direction');
    if (hasL) for (let k = 0; k < N; k++) head.push('b' + k);
    const rows = [head.join(',')];
    spins.forEach(s => {
      const r = [s.n, s.session, s.dealer || ''];
      if (hasDir) r.push(s.dir === 'A' ? 'cw' : s.dir === 'B' ? 'ccw' : '');
      // Liability is exported as an equivalent straight-up stake (liability / 36).
      if (hasL) for (let k = 0; k < N; k++) r.push(s.liab ? +(s.liab[k] / 36).toFixed(3) : 0);
      rows.push(r.join(','));
    });
    return rows.join('\n');
  }

  // ---------- Statistical tests ----------
  function midRank(L, y) {
    let less = 0, eq = 0;
    for (let k = 0; k < N; k++) { if (L[k] < L[y]) less++; else if (L[k] === L[y]) eq++; }
    return (less + (eq - 1) / 2) / (N - 1);
  }
  function rankVariance(L) {
    let v = 0;
    for (let k = 0; k < N; k++) { const r = midRank(L, k) - 0.5; v += r * r; }
    return v / N;
  }

  function runTests(spins) {
    const out = {};
    const n = spins.length;
    const counts = new Array(N).fill(0);
    spins.forEach(s => counts[s.n]++);
    out.counts = counts;
    out.n = n;
    const e = n / N;
    let chi = 0;
    for (let k = 0; k < N; k++) chi += (counts[k] - e) ** 2 / (e || 1);
    out.uniform = { stat: chi, df: 36, p: n ? chi2p(chi, 36) : 1 };
    const sorted = counts.map((c, k) => ({ k, c, z: e ? (c - e) / Math.sqrt(e * (1 - 1 / N)) : 0 })).sort((a, b) => b.z - a.z);
    out.hot = sorted.slice(0, 5);
    out.cold = sorted.slice(-5).reverse();

    // Rayleigh test on wheel position: does the ball favour one side of the wheel (tilt, worn rotor)?
    let cx = 0, cy = 0;
    spins.forEach(s => { const a = 2 * Math.PI * POS[s.n] / N; cx += Math.cos(a); cy += Math.sin(a); });
    const R = n ? Math.sqrt(cx * cx + cy * cy) / n : 0;
    const Z = n * R * R;
    out.rayleigh = { R, Z, p: n ? Math.min(1, Math.exp(-Z) * (1 + (2 * Z - Z * Z) / (4 * n))) : 1, angle: Math.atan2(cy, cx) };

    // Launch signature (dealer's hand or the machine): wheel distance between consecutive results in a session.
    const dc = new Array(N).fill(0);
    let dn = 0;
    for (let i = 1; i < n; i++) if (spins[i].session === spins[i - 1].session) { dc[wheelDist(spins[i - 1].n, spins[i].n)]++; dn++; }
    let dchi = 0;
    for (let d = 0; d < N; d++) dchi += (dc[d] - dn / N) ** 2 / ((dn / N) || 1);
    out.signature = { counts: dc, n: dn, stat: dchi, p: dn ? chi2p(dchi, 36) : 1, top: dc.map((c, d) => ({ d, c })).sort((a, b) => b.c - a.c).slice(0, 3) };
    // Same, but separately for each launch direction; a machine that alternates direction can hide
    // two sharp patterns inside one flat-looking distribution.
    const dirs = directions(spins);
    const byDir = { A: new Array(N).fill(0), B: new Array(N).fill(0) };
    for (let i = 1; i < n; i++) if (spins[i].session === spins[i - 1].session) byDir[dirs[i]][wheelDist(spins[i - 1].n, spins[i].n)]++;
    let schi = 0, sdf = 0;
    const tops = {};
    ['A', 'B'].forEach(k => {
      const c = byDir[k], m = c.reduce((a, b) => a + b, 0);
      if (!m) return;
      for (let d = 0; d < N; d++) schi += (c[d] - m / N) ** 2 / (m / N);
      sdf += 36;
      tops[k] = c.map((v, d) => ({ d, c: v })).sort((a, b) => b.c - a.c).slice(0, 2);
    });
    out.signatureDir = { stat: schi, df: sdf, p: sdf ? chi2p(schi, sdf) : 1, top: tops, recorded: spins.some(s => s.dir) };

    // Wald–Wolfowitz runs test on red/black (zeros dropped).
    const cs = spins.map(s => colorOf(s.n)).filter(c => c !== 'G');
    const n1 = cs.filter(c => c === 'R').length, n2 = cs.length - n1;
    let runs = cs.length ? 1 : 0;
    for (let i = 1; i < cs.length; i++) if (cs[i] !== cs[i - 1]) runs++;
    const mu = 2 * n1 * n2 / (n1 + n2) + 1;
    const vr = 2 * n1 * n2 * (2 * n1 * n2 - n1 - n2) / (((n1 + n2) ** 2) * (n1 + n2 - 1));
    const rz = vr > 0 ? (runs - mu) / Math.sqrt(vr) : 0;
    let longest = 0, cur = 0;
    for (let i = 0; i < cs.length; i++) { cur = i && cs[i] === cs[i - 1] ? cur + 1 : 1; longest = Math.max(longest, cur); }
    out.runs = { runs, expected: mu, z: rz, p: twoSided(rz), longest };

    // Markov test on dozens: does the next dozen depend on the previous one?
    const T = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 1; i < n; i++) {
      const a = spins[i - 1].n, b = spins[i].n;
      if (a && b) T[Math.floor((a - 1) / 12)][Math.floor((b - 1) / 12)]++;
    }
    const rs = T.map(r => r[0] + r[1] + r[2]), csum = [0, 1, 2].map(j => T[0][j] + T[1][j] + T[2][j]);
    const tot = rs[0] + rs[1] + rs[2];
    let mchi = 0;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const ex = rs[i] * csum[j] / (tot || 1); if (ex) mchi += (T[i][j] - ex) ** 2 / ex; }
    out.markov = { table: T, stat: mchi, p: tot ? chi2p(mchi, 4) : 1 };

    // Crowd test: is the winning number systematically one the table had little money on?
    const withL = spins.filter(s => s.liab);
    if (withL.length) {
      let sr = 0, sv = 0, low5 = 0, exp5 = 0;
      withL.forEach(s => {
        sr += midRank(s.liab, s.n) - 0.5;
        sv += rankVariance(s.liab);
        const order = Array.from(s.liab).map((v, k) => ({ v, k })).sort((a, b) => a.v - b.v);
        const cutoff = order[4].v;
        const cheap = order.filter(o => o.v <= cutoff).length;
        if (s.liab[s.n] <= cutoff) low5++;
        exp5 += cheap / N;
      });
      const z = sv > 0 ? sr / Math.sqrt(sv) : 0;
      // Negative z = winners sit on low-liability pockets more than chance allows.
      out.crowd = { n: withL.length, meanRank: 0.5 + sr / withL.length, z, p: normSf(-z), low5, exp5 };
    }

    // Per-session view, so a few rigged sessions are not averaged away.
    const bySession = new Map();
    spins.forEach(s => { if (!bySession.has(s.session)) bySession.set(s.session, []); bySession.get(s.session).push(s); });
    out.sessions = [];
    bySession.forEach((arr, id) => {
      const c = new Array(N).fill(0); arr.forEach(s => c[s.n]++);
      const ee = arr.length / N;
      let x = 0; for (let k = 0; k < N; k++) x += (c[k] - ee) ** 2 / ee;
      let cz = null;
      const wl = arr.filter(s => s.liab);
      if (wl.length) {
        let a = 0, v = 0;
        wl.forEach(s => { a += midRank(s.liab, s.n) - 0.5; v += rankVariance(s.liab); });
        cz = v > 0 ? a / Math.sqrt(v) : 0;
      }
      out.sessions.push({ id, n: arr.length, p: chi2p(x, 36), crowdZ: cz, crowdP: cz == null ? null : normSf(-cz), dealer: arr[0].dealer || '' });
    });
    const m = out.sessions.length || 1;
    out.sessions.forEach(s => { s.flag = (s.crowdP != null && s.crowdP < 0.05 / m) || s.p < 0.01 / m; });
    return out;
  }

  // ---------- Prediction models ----------
  // Each model: predict(ctx) -> Float64Array(37) summing to 1; update(ctx, y).
  // ctx = { prev, liab, step, gaps }
  const uniformP = () => new Float64Array(N).fill(1 / N);
  function normalize(p) {
    let s = 0; for (let k = 0; k < N; k++) s += p[k];
    for (let k = 0; k < N; k++) p[k] /= s;
    return p;
  }
  function softmaxNeg(z, beta) {
    const p = new Float64Array(N);
    let mx = -Infinity;
    for (let k = 0; k < N; k++) mx = Math.max(mx, -beta * z[k]);
    for (let k = 0; k < N; k++) p[k] = Math.exp(-beta * z[k] - mx);
    return normalize(p);
  }
  function standardize(v) {
    let m = 0; for (let k = 0; k < N; k++) m += v[k]; m /= N;
    let s = 0; for (let k = 0; k < N; k++) s += (v[k] - m) ** 2; s = Math.sqrt(s / N);
    const z = new Float64Array(N);
    if (s < 1e-12) return z;
    for (let k = 0; k < N; k++) z[k] = (v[k] - m) / s;
    return z;
  }

  // Uniform weight over the five pockets that would cost the house least (ties included).
  function cheapSet(L) {
    const sorted = Array.from(L).sort((a, b) => a - b), cut = sorted[4];
    const q = new Float64Array(N);
    let c = 0;
    for (let k = 0; k < N; k++) if (L[k] <= cut) { q[k] = 1; c++; }
    for (let k = 0; k < N; k++) q[k] /= c;
    return q;
  }

  const MODEL_INFO = {
    uniform: { label: 'Шударга дугуй', hint: '37 нүд бүгд 1/37. Харьцуулах суурь.' },
    freq: { label: 'Давтамж', hint: 'Олон буусан тоо дахин бууна гэж үзнэ (хазгай дугуй).' },
    sector: { label: 'Дугуйн хэсэг', hint: 'Дугуй дээр зэргэлдээ нүднүүдийн давтамжийг нэгтгэнэ (налуу, элэгдэл).' },
    signature: { label: 'Шидэлтийн зай', hint: 'Өмнөх тооноос дугуй дээр хэдэн нүд алгасахыг сурна (дилер эсвэл машин).' },
    signatureDir: { label: 'Чиглэлтэй шидэлт', hint: 'Мөн адил, гэхдээ бөмбөгийг шидсэн чиглэл бүрээр тусад нь сурна (автомат дугуй).' },
    markov: { label: 'Дараалал', hint: 'Өмнөх тоо дараагийнхыг тодорхойлдог эсэх.' },
    crowd: { label: 'Олны эсрэг', hint: 'Их бооцоотой нүд буухгүй гэж таана (казино удирддаг бол).' },
    overdue: { label: '“Удсан тоо”', hint: 'Тоглогчдын итгэл: удаан буугаагүй тоо удахгүй бууна. Жин нь хасах бол эсрэгээрээ.' },
  };

  function makeModels(cfg) {
    const decay = cfg.decay, a = 1;
    const freqRaw = new Float64Array(N);
    let freqSum = 0;
    const freqP = () => { const p = new Float64Array(N); for (let k = 0; k < N; k++) p[k] = (freqRaw[k] + a) / (freqSum + N * a); return p; };
    const decayFreq = y => { for (let k = 0; k < N; k++) freqRaw[k] *= decay; freqSum = freqSum * decay + 1; freqRaw[y] += 1; };
    const sigRaw = new Float64Array(N);
    const sigDir = { A: new Float64Array(N), B: new Float64Array(N) };
    let sigSum = 0;
    const M = Array.from({ length: N }, () => new Float64Array(N));
    const Msum = new Float64Array(N);
    const KERNEL = [1, 0.7, 0.4, 0.15];
    let rhoG = 0.02, rhoS = 0.02, gamma = 0;
    const lr = cfg.lr;
    return [
      { id: 'uniform', predict: () => uniformP(), update() {} },
      { id: 'freq', predict: freqP, update(ctx, y) { decayFreq(y); } },
      {
        id: 'sector',
        predict() {
          const p = new Float64Array(N);
          for (let i = 0; i < N; i++) {
            let s = 0;
            for (let o = -3; o <= 3; o++) s += KERNEL[Math.abs(o)] * freqRaw[WHEEL[(i + o + N) % N]];
            p[WHEEL[i]] = s / 3.3 + a;
          }
          return normalize(p);
        },
        update() {},
      },
      {
        id: 'signature',
        predict(ctx) {
          if (ctx.prev == null) return uniformP();
          const p = new Float64Array(N);
          for (let k = 0; k < N; k++) {
            const d = wheelDist(ctx.prev, k);
            let s = 0;
            for (let o = -2; o <= 2; o++) s += KERNEL[Math.abs(o)] * sigRaw[(d + o + N) % N];
            p[k] = s / 2.8 + a;
          }
          return normalize(p);
        },
        update(ctx, y) {
          if (ctx.prev == null) return;
          for (let d = 0; d < N; d++) sigRaw[d] *= decay;
          sigSum = sigSum * decay + 1;
          sigRaw[wheelDist(ctx.prev, y)] += 1;
        },
      },
      {
        id: 'signatureDir',
        predict(ctx) {
          if (ctx.prev == null) return uniformP();
          const t = sigDir[ctx.dir], p = new Float64Array(N);
          for (let k = 0; k < N; k++) {
            const d = wheelDist(ctx.prev, k);
            let s = 0;
            for (let o = -2; o <= 2; o++) s += KERNEL[Math.abs(o)] * t[(d + o + N) % N];
            p[k] = s / 2.8 + a;
          }
          return normalize(p);
        },
        update(ctx, y) {
          if (ctx.prev == null) return;
          const t = sigDir[ctx.dir];
          for (let d = 0; d < N; d++) t[d] *= decay;
          t[wheelDist(ctx.prev, y)] += 1;
        },
      },
      {
        id: 'markov',
        predict(ctx) {
          if (ctx.prev == null) return freqP();
          const base = freqP(), row = M[ctx.prev], k0 = 20, p = new Float64Array(N);
          for (let k = 0; k < N; k++) p[k] = (row[k] + k0 * base[k]) / (Msum[ctx.prev] + k0);
          return p;
        },
        update(ctx, y) {
          if (ctx.prev == null) return;
          const row = M[ctx.prev];
          for (let k = 0; k < N; k++) row[k] *= decay;
          Msum[ctx.prev] = Msum[ctx.prev] * decay + 1;
          row[y] += 1;
        },
      },
      {
        id: 'crowd',
        // Mixture: with rate rho the house picks one of the five cheapest pockets, otherwise the wheel is fair.
        // rho is learned by online EM: a slow table-wide value and a fast one that restarts every session.
        predict(ctx) {
          if (!ctx.liab) return uniformP();
          if (ctx.newSession) rhoS = rhoG;
          const q = cheapSet(ctx.liab), p = new Float64Array(N);
          for (let k = 0; k < N; k++) p[k] = (1 - rhoS) / N + rhoS * q[k];
          return p;
        },
        update(ctx, y) {
          if (!ctx.liab) return;
          const q = cheapSet(ctx.liab);
          const resp = (rhoS * q[y]) / ((1 - rhoS) / N + rhoS * q[y]);
          const respG = (rhoG * q[y]) / ((1 - rhoG) / N + rhoG * q[y]);
          rhoS = Math.min(0.95, Math.max(0.001, rhoS + 0.08 * (resp - rhoS)));
          rhoG = Math.min(0.95, Math.max(0.001, rhoG + lr * 0.2 * (respG - rhoG)));
        },
        param: () => rhoG,
      },
      {
        id: 'overdue',
        predict(ctx) {
          const g = new Float64Array(N); for (let k = 0; k < N; k++) g[k] = -Math.log1p(ctx.gaps[k]);
          return softmaxNeg(standardize(g), gamma);
        },
        update(ctx, y) {
          const g = new Float64Array(N); for (let k = 0; k < N; k++) g[k] = -Math.log1p(ctx.gaps[k]);
          const z = standardize(g), p = softmaxNeg(z, gamma);
          let ez = 0; for (let k = 0; k < N; k++) ez += p[k] * z[k];
          gamma = Math.max(-3, Math.min(3, gamma + lr * 0.5 * (ez - z[y])));
        },
        param: () => gamma,
      },
    ];
  }

  const DEFAULT_CFG = { decay: 0.999, share: 0.01, eta: 1, lr: 0.03, margin: 0.1, maxBets: 3 };

  // Walk-forward: every spin is predicted before the model sees it. Nothing peeks at the future.
  // scoreFrom: spins before this index train the model but are not scored (holdout evaluation).
  function walkForward(spins, cfg, opts) {
    cfg = Object.assign({}, DEFAULT_CFG, cfg || {});
    opts = opts || {};
    const scoreFrom = opts.scoreFrom || 0;
    const models = makeModels(cfg);
    const K = models.length;
    let w = new Float64Array(K).fill(1 / K);
    const gaps = new Float64Array(N).fill(N);
    const LOG2N = Math.log2(N);
    let bits = 0, scored = 0, top1 = 0, top3 = 0;
    const modelBits = new Float64Array(K);
    const curve = [], weightsHist = [], bank = [];
    let bankroll = 0, bets = 0, hits = 0, expectedHits = 0;
    const every = Math.max(1, Math.floor(spins.length / 300));
    const dirs = directions(spins);
    let prev = null, prevSession = null;
    for (let t = 0; t < spins.length; t++) {
      const s = spins[t];
      if (s.session !== prevSession) prev = null;
      const ctx = { prev, liab: s.liab, gaps, step: t, dir: dirs[t], newSession: s.session !== prevSession };
      const preds = models.map(m => m.predict(ctx));
      const p = new Float64Array(N);
      for (let i = 0; i < K; i++) for (let k = 0; k < N; k++) p[k] += w[i] * preds[i][k];
      const y = s.n;
      if (t >= scoreFrom) {
        scored++;
        const g = LOG2N + Math.log2(p[y]);
        bits += g;
        for (let i = 0; i < K; i++) modelBits[i] += LOG2N + Math.log2(preds[i][y]);
        const order = Array.from(p).map((v, k) => ({ v, k })).sort((a, b) => b.v - a.v);
        if (order[0].k === y) top1++;
        if (order.slice(0, 3).some(o => o.k === y)) top3++;
        // Bet one unit straight-up on each number whose expected return 36p - 1 beats the margin.
        const picks = order.filter(o => 36 * o.v - 1 > cfg.margin).slice(0, cfg.maxBets);
        picks.forEach(o => { bets++; expectedHits += 1 / N; if (o.k === y) { hits++; bankroll += 35; } else bankroll -= 1; });
        if (scored % every === 0 || t === spins.length - 1) {
          curve.push({ t, bits });
          bank.push({ t, v: bankroll });
          weightsHist.push({ t, w: Array.from(w) });
        }
      }
      // Hedge / Bayesian mixture update, then fixed-share so weights can move when a session changes regime.
      let sw = 0;
      for (let i = 0; i < K; i++) { w[i] *= Math.pow(Math.max(preds[i][y], 1e-12) * N, cfg.eta); sw += w[i]; }
      for (let i = 0; i < K; i++) w[i] = (1 - cfg.share) * (w[i] / sw) + cfg.share / K;
      models.forEach(m => m.update(ctx, y));
      for (let k = 0; k < N; k++) gaps[k]++;
      gaps[y] = 0;
      prev = y; prevSession = s.session;
    }
    return {
      cfg, scored, bits, bitsPerSpin: scored ? bits / scored : 0,
      top1, top3, curve, bank, weightsHist,
      models: models.map((m, i) => ({ id: m.id, bits: modelBits[i], weight: w[i], param: m.param ? m.param() : null })),
      betting: { bets, hits, expectedHits, bankroll, roi: bets ? bankroll / bets : 0, p: bets ? binomSf(hits, bets, 1 / N) : 1 },
    };
  }

  // Null distribution: the same pipeline on a fair wheel. Bets and sessions stay in place,
  // only the numbers are redrawn uniformly, so any "skill" seen here is pure luck.
  function nullRuns(spins, cfg, opts, reps, seed) {
    const r = rng(seed || 7);
    const out = [];
    for (let i = 0; i < reps; i++) {
      const sh = spins.map(s => ({ n: Math.floor(r() * N), session: s.session, dealer: s.dealer, dir: s.dir, liab: s.liab }));
      const res = walkForward(sh, cfg, opts);
      out.push({ bits: res.bits, bitsPerSpin: res.bitsPerSpin, roi: res.betting.roi, bankroll: res.betting.bankroll });
    }
    return out;
  }

  // Trial and error: try settings on the first part, keep the best, judge it on the untouched last part.
  function train(spins, opts) {
    opts = opts || {};
    const split = Math.floor(spins.length * (opts.trainFrac || 0.7));
    const train = spins.slice(0, split);
    const grid = [];
    [1, 0.999, 0.99].forEach(decay => [0.002, 0.02, 0.08].forEach(share => grid.push({ decay, share, lr: 0.05 })));
    const trials = grid.map(g => {
      const r = walkForward(train, g, { scoreFrom: Math.floor(train.length * 0.3) });
      return { cfg: r.cfg, bitsPerSpin: r.bitsPerSpin };
    }).sort((a, b) => b.bitsPerSpin - a.bitsPerSpin);
    const best = trials[0].cfg;
    // Betting threshold is tuned on the training part as well.
    const margins = [0.05, 0.15, 0.3, 0.6].map(margin => {
      const r = walkForward(train, Object.assign({}, best, { margin }), { scoreFrom: Math.floor(train.length * 0.3) });
      return { margin, roi: r.betting.roi, bets: r.betting.bets };
    });
    const bestMargin = margins.filter(m => m.bets >= 20).sort((a, b) => b.roi - a.roi)[0];
    best.margin = bestMargin ? bestMargin.margin : 0.6;
    const test = walkForward(spins, best, { scoreFrom: split });
    const reps = opts.reps || 19;
    if (opts.onProgress) opts.onProgress('null');
    const nulls = nullRuns(spins, best, { scoreFrom: split }, reps, opts.seed);
    const beatBits = nulls.filter(x => x.bitsPerSpin >= test.bitsPerSpin).length;
    const beatRoi = nulls.filter(x => x.roi >= test.betting.roi).length;
    return {
      split, trials, best, test, nulls,
      pBits: (beatBits + 1) / (reps + 1),
      pRoi: (beatRoi + 1) / (reps + 1),
      verdict: verdict(test, (beatBits + 1) / (reps + 1)),
    };
  }

  function verdict(test, pBits) {
    const b = test.betting;
    if (test.scored < 200) return { level: 'thin', text: 'Шалгах хэсэгт 200-аас цөөн эргэлт байна. Дор хаяж 2000 эргэлт оруулбал дүгнэлт найдвартай болно.' };
    if (pBits < 0.06 && test.bitsPerSpin > 0 && b.bets > 0 && b.roi > 0 && b.p < 0.01)
      return { level: 'edge', text: 'Шалгах хэсэгт загвар шударга дугуйгаар үүсгэсэн өгөгдлөөс тогтвортой илүү таасан ба бооцоо нь ашигтай гарлаа. Шинэ өгөгдөл дээр давтан шалгаж баталгаажуул.' };
    if (pBits < 0.06 && test.bitsPerSpin > 0)
      return { level: 'signal', text: 'Хэв маяг бага зэрэг илэрсэн ч казиногийн 2.7%-ийн давуу талыг давахад хүрэхгүй байна.' };
    return { level: 'none', text: 'Хэв маяг илэрсэнгүй. Энэ өгөгдөл шударга дугуйнаас ялгагдахгүй, ямар ч бооцооны систем урт хугацаанд алдана.' };
  }

  // ---------- Simulator ----------
  // Players with simple, research-based habits. They produce bets (=> table liability) and a bet log.
  const PLAYER_TYPES = {
    fallacy: '“Ээлж ирнэ” төөрөгдөл',
    hot: '“Халуун гар”',
    martingale: 'Мартингейл',
    chaser: 'Алдсанаа хөөгч',
    casual: 'Энгийн',
  };

  function simulate(o) {
    o = Object.assign({ spins: 3000, sessions: 30, wheel: 'fair', bias: 0.25, house: 0.3, steer: 0.35, players: 12, seed: 42 }, o);
    const r = rng(o.seed);
    const typeKeys = Object.keys(PLAYER_TYPES);
    const players = Array.from({ length: o.players }, (_, i) => ({
      id: 'P' + (i + 1),
      type: typeKeys[i % typeKeys.length],
      base: [1, 2, 5, 10][Math.floor(r() * 4)],
      stake: 0, losses: 0,
      fav: Array.from({ length: 3 }, () => 1 + Math.floor(r() * 31)),
      color: r() < 0.5 ? 'R' : 'B',
    }));
    players.forEach(p => { p.stake = p.base; });
    const per = Math.ceil(o.spins / o.sessions);
    const biasPockets = new Set([WHEEL[5], WHEEL[6], WHEEL[7], WHEEL[8]]);
    const sigD = 1 + Math.floor(r() * 35), sigD2 = 1 + Math.floor(r() * 35);
    const rigged = new Set();
    for (let s = 1; s <= o.sessions; s++) if (o.wheel === 'house' && r() < o.house) rigged.add(String(s));
    const spins = [], log = [], history = [];
    const gaps = new Array(N).fill(0);
    for (let t = 0; t < o.spins; t++) {
      const session = String(Math.floor(t / per) + 1);
      const sameSession = t > 0 && spins[t - 1].session === session;
      // Streak of the last colors, used by the psychology rules.
      let streakC = null, streak = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        const c = colorOf(history[i]);
        if (c === 'G') break;
        if (streakC == null) streakC = c;
        if (c !== streakC) break;
        streak++;
      }
      const L = new Float64Array(N);
      const bets = [];
      players.forEach(p => {
        if (r() < 0.15) return; // sits out this spin
        let kind = 'color', pick, stake = p.stake;
        if (p.type === 'fallacy') {
          if (streak >= 2) pick = streakC === 'R' ? 'B' : 'R';
          else if (r() < 0.5) { kind = 'number'; pick = gaps.indexOf(Math.max(...gaps)); stake = Math.max(1, Math.round(p.base / 2)); }
          else pick = r() < 0.5 ? 'R' : 'B';
        } else if (p.type === 'hot') {
          if (streak >= 2) pick = streakC;
          else if (history.length && r() < 0.5) { kind = 'number'; pick = history[history.length - 1]; stake = Math.max(1, Math.round(p.base / 2)); }
          else pick = r() < 0.5 ? 'R' : 'B';
        } else if (p.type === 'martingale') {
          pick = p.color;
        } else if (p.type === 'chaser') {
          if (p.losses >= 3) { kind = 'number'; pick = p.fav[Math.floor(r() * 3)]; }
          else pick = r() < 0.5 ? 'R' : 'B';
        } else {
          if (r() < 0.6) { kind = 'number'; pick = r() < 0.7 ? p.fav[Math.floor(r() * 3)] : Math.floor(r() * N); stake = p.base; }
          else pick = r() < 0.5 ? 'R' : 'B';
          stake = p.base;
        }
        if (kind === 'color') for (let k = 0; k < N; k++) { if (colorOf(k) === pick) L[k] += 2 * stake; }
        else L[pick] += 36 * stake;
        bets.push({ p, kind, pick, stake });
      });
      // Outcome.
      let y;
      const pr = new Float64Array(N).fill(1);
      if (o.wheel === 'biased') biasPockets.forEach(k => { pr[k] *= 1 + o.bias * 4; });
      const dir = (t % per) % 2 ? 'B' : 'A';
      if ((o.wheel === 'dealer' || o.wheel === 'machine') && sameSession && r() < o.bias) {
        const base = o.wheel === 'machine' && dir === 'B' ? sigD2 : sigD;
        const d = (base + Math.round((r() - 0.5) * 4) + N) % N;
        y = WHEEL[(POS[spins[t - 1].n] + d) % N];
      } else if (o.wheel === 'house' && rigged.has(session) && r() < o.steer) {
        // The house picks among the five pockets that would cost it least.
        const cheap = Array.from(L).map((v, k) => ({ v, k })).sort((a, b) => a.v - b.v).slice(0, 5);
        y = cheap[Math.floor(r() * 5)].k;
      } else {
        y = pickWeighted(normalize(pr), r);
      }
      spins.push({ n: y, session, dealer: o.wheel === 'dealer' ? 'D1' : '', liab: L });
      bets.forEach(b => {
        const win = b.kind === 'color' ? colorOf(y) === b.pick : y === b.pick;
        log.push({ round: t + 1, player: b.p.id, bet: b.kind === 'color' ? b.pick : String(b.pick), stake: b.stake, outcome: y, type: b.p.type });
        const p = b.p;
        if (p.type === 'martingale') p.stake = win ? p.base : Math.min(p.stake * 2, p.base * 64);
        else if (p.type === 'chaser') { p.losses = win ? 0 : p.losses + 1; p.stake = win || p.stake >= p.base * 8 ? p.base : Math.ceil(p.stake * 1.5); }
        else if (p.type === 'hot') p.stake = win ? Math.ceil(p.stake * 1.5) : p.base;
        else p.stake = p.base;
      });
      for (let k = 0; k < N; k++) gaps[k]++;
      gaps[y] = 0;
      history.push(y);
    }
    return { spins, log, truth: { players: Object.fromEntries(players.map(p => [p.id, p.type])), wheel: o.wheel, rigged: Array.from(rigged), biasPockets: Array.from(biasPockets), sigD, sigD2 } };
  }

  // ---------- Player psychology ----------
  function parsePlayerLog(text) {
    const lines = String(text || '').replace(/\r/g, '').split('\n').filter(l => l.trim());
    if (!lines.length) return { rows: [], errors: ['Хоосон байна.'] };
    const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
    const head = lines[0].split(sep).map(h => h.trim().toLowerCase());
    const ix = n => head.findIndex(h => n.includes(h));
    const iR = ix(['round', 'spin', 'эргэлт']), iP = ix(['player', 'тоглогч']), iB = ix(['bet', 'pick', 'бооцоо']);
    const iS = ix(['stake', 'amount', 'дүн']), iO = ix(['outcome', 'number', 'result', 'үр дүн']);
    if ([iR, iP, iB, iS, iO].some(i => i < 0)) return { rows: [], errors: ['Толгой мөр: round,player,bet,stake,outcome байх ёстой.'] };
    const rows = [], errors = [];
    lines.slice(1).forEach((l, li) => {
      const c = l.split(sep).map(x => x.trim());
      let bet = c[iB].toUpperCase();
      if (bet === 'RED' || bet === 'УЛААН') bet = 'R';
      if (bet === 'BLACK' || bet === 'ХАР') bet = 'B';
      const outcome = parseInt(c[iO], 10), stake = parseFloat(c[iS]), round = parseInt(c[iR], 10);
      if (!(outcome >= 0 && outcome <= 36) || !(stake > 0) || !(round >= 0)) { errors.push(`${li + 2}-р мөр алгаслаа.`); return; }
      rows.push({ round, player: c[iP], bet, stake, outcome });
    });
    return { rows, errors };
  }

  function playerLogToCsv(log) {
    return ['round,player,bet,stake,outcome'].concat(log.map(l => [l.round, l.player, l.bet, l.stake, l.outcome].join(','))).join('\n');
  }

  function analyzePlayers(rows) {
    // Outcome sequence by round, to know the streak each player saw before betting.
    const outcomeByRound = new Map();
    rows.forEach(r => outcomeByRound.set(r.round, r.outcome));
    const rounds = Array.from(outcomeByRound.keys()).sort((a, b) => a - b);
    const ctxByRound = new Map();
    const lastSeen = new Map();
    const hist = [];
    rounds.forEach(rd => {
      let streakC = null, streak = 0;
      for (let i = hist.length - 1; i >= 0; i--) {
        const c = colorOf(hist[i]);
        if (c === 'G') break;
        if (streakC == null) streakC = c;
        if (c !== streakC) break;
        streak++;
      }
      ctxByRound.set(rd, { streakC, streak, gaps: new Map(lastSeen), idx: hist.length });
      const y = outcomeByRound.get(rd);
      hist.push(y);
      lastSeen.set(y, hist.length - 1);
    });

    const byPlayer = new Map();
    rows.slice().sort((a, b) => a.round - b.round).forEach(r => {
      if (!byPlayer.has(r.player)) byPlayer.set(r.player, []);
      byPlayer.get(r.player).push(r);
    });
    const players = [];
    byPlayer.forEach((list, id) => {
      let against = 0, withS = 0, streakBets = 0;
      let upAfterLoss = 0, afterLoss = 0, upAfterWin = 0, afterWin = 0, ratioLoss = [], ratioWin = [];
      let gapSum = 0, gapN = 0;
      let colorOk = 0, colorTried = 0, dirOk = 0, dirTried = 0, dirBase = { up: 0, same: 0, down: 0 };
      const colorTable = new Map(), dirTable = new Map();
      let prevRow = null, prevWin = null;
      list.forEach(r => {
        const ctx = ctxByRound.get(r.round);
        const isColor = r.bet === 'R' || r.bet === 'B';
        const win = isColor ? colorOf(r.outcome) === r.bet : String(r.outcome) === r.bet;
        const streakKey = ctx.streak >= 2 ? ctx.streakC + Math.min(ctx.streak, 4) : '-';
        // Predict before learning from this row (walk-forward).
        if (isColor) {
          const key = streakKey + '|' + (prevWin == null ? '?' : prevWin ? 'W' : 'L');
          const t = colorTable.get(key) || colorTable.get('all') || { R: 0, B: 0 };
          const guess = t.R >= t.B ? 'R' : 'B';
          colorTried++; if (guess === r.bet) colorOk++;
          [key, 'all'].forEach(k => { const v = colorTable.get(k) || { R: 0, B: 0 }; v[r.bet]++; colorTable.set(k, v); });
          if (ctx.streak >= 2) { streakBets++; if (r.bet === ctx.streakC) withS++; else against++; }
        } else {
          const n = parseInt(r.bet, 10);
          if (ctx.gaps.has(n)) { gapSum += ctx.idx - ctx.gaps.get(n); gapN++; } else if (ctx.idx > 0) { gapSum += ctx.idx; gapN++; }
        }
        if (prevRow) {
          const ratio = r.stake / prevRow.stake;
          const dir = ratio > 1.05 ? 'up' : ratio < 0.95 ? 'down' : 'same';
          const key = prevWin ? 'W' : 'L';
          const t = dirTable.get(key);
          if (t) {
            const guess = Object.keys(t).sort((a, b) => t[b] - t[a])[0];
            dirTried++; if (guess === dir) dirOk++;
          }
          const v = t || { up: 0, same: 0, down: 0 }; v[dir]++; dirTable.set(key, v);
          dirBase[dir]++;
          if (prevWin) { ratioWin.push(ratio); afterWin++; if (dir === 'up') upAfterWin++; } else { ratioLoss.push(ratio); afterLoss++; if (dir === 'up') upAfterLoss++; }
        }
        prevRow = r; prevWin = win;
      });
      const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
      const lossRatio = med(ratioLoss), winRatio = med(ratioWin);
      const fallacy = streakBets ? against / streakBets : null;
      const avgGap = gapN ? gapSum / gapN : null;
      const majority = Math.max(dirBase.up, dirBase.same, dirBase.down) / Math.max(1, dirBase.up + dirBase.same + dirBase.down);
      // Rule-based label from the measured habits.
      let label = 'casual';
      if (lossRatio != null && lossRatio >= 1.8 && lossRatio <= 2.2 && list.every(x => x.bet === list[0].bet)) label = 'martingale';
      else if (afterLoss >= 5 && upAfterLoss / afterLoss - (afterWin ? upAfterWin / afterWin : 0) > 0.3) label = 'chaser';
      else if (fallacy != null && streakBets >= 8 && fallacy > 0.7) label = 'fallacy';
      else if (fallacy != null && streakBets >= 8 && fallacy < 0.3) label = 'hot';
      players.push({
        id, bets: list.length, avgStake: list.reduce((s, x) => s + x.stake, 0) / list.length,
        fallacy, streakBets, lossRatio, winRatio, chase: afterLoss ? upAfterLoss / afterLoss : null, chaseWin: afterWin ? upAfterWin / afterWin : null,
        avgGap, label,
        colorAcc: colorTried ? colorOk / colorTried : null, colorTried,
        dirAcc: dirTried ? dirOk / dirTried : null, dirTried, dirBaseline: majority,
        truth: list[0].type || null,
      });
    });
    players.sort((a, b) => b.bets - a.bets);
    return players;
  }

  const api = {
    N, WHEEL, POS, colorOf, wheelDist, OUTSIDE, rng,
    chi2p, normSf, binomSf,
    parseSpins, spinsToCsv, runTests,
    MODEL_INFO, DEFAULT_CFG, walkForward, nullRuns, train,
    PLAYER_TYPES, simulate, parsePlayerLog, playerLogToCsv, analyzePlayers,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PL = api;
})(typeof window !== 'undefined' ? window : globalThis);
