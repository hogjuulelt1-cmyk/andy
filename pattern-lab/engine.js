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
  // A spin: { n, session, dealer, dir, time, players, won, mult, liab: Float64Array(37) | null }
  // time: ms since epoch or null. players: how many people bet on this spin. won: total paid out.
  // mult: { number: multiplier } for lightning-style games (multipliers are revealed after bets close).
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

  function parseTime(v) {
    const t = String(v == null ? '' : v).trim();
    if (!t) return null;
    const hm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t);
    if (hm) return Date.UTC(1970, 0, 2, +hm[1], +hm[2], +(hm[3] || 0)); // time of day only
    const ms = Date.parse(t.replace(' ', 'T'));
    return isNaN(ms) ? null : ms;
  }
  function parseMult(v) {
    const out = {};
    let any = false;
    String(v == null ? '' : v).replace(/(\d{1,2})\s*[:x×*]\s*(\d+)/gi, (m, n, k) => { if (+n <= 36 && +k > 1) { out[+n] = +k; any = true; } return m; });
    return any ? out : null;
  }
  const multToStr = m => m ? Object.keys(m).map(k => k + ':' + m[k]).join(' ') : '';

  function parseSpins(text) {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    const first = lines.find(l => l.trim()) || '';
    const errors = [];
    const spins = [];
    // A CSV header: every cell starts with a letter ("number,session,b0"), unlike "(5x100), 17".
    if (/^\s*[a-zа-яөү_][\w\-]*(\s*[,;\t]\s*[a-zа-яөү_][\w\-]*)+\s*$/i.test(first)) {
      const sep = first.includes('\t') ? '\t' : first.includes(';') ? ';' : ',';
      const head = first.split(sep).map(h => h.trim().toLowerCase());
      const col = names => head.findIndex(h => names.includes(h));
      const iN = col(['number', 'n', 'result', 'outcome', 'тоо', 'үр дүн']);
      const iS = col(['session', 'сесс', 'session_id', 'table_session']);
      const iD = col(['dealer', 'дилер', 'croupier', 'machine', 'wheel']);
      const iR = col(['direction', 'dir', 'чиглэл', 'spin_direction']);
      const iT = col(['time', 'timestamp', 'datetime', 'date', 'цаг', 'огноо']);
      const iP = col(['players', 'player_count', 'тоглогч', 'тоглогчид']);
      const iW = col(['won', 'total_won', 'payout', 'paid', 'хожсон']);
      const iWin = col(['winners', 'winner_count', 'хожсон хүн', 'хожигчид']);
      const iSt = col(['steer', 'magnet', 'соронз']);
      const iM = col(['multipliers', 'multiplier', 'lightning', 'mult', 'үржүүлэгч']);
      const iH = col(['hit', 'lightning_hit', 'mult_hit', 'буусан']);
      const iPart = col(['mult_partial', 'partial']);
      if (iN < 0) return parsePlainList(text);
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
          time: iT >= 0 ? parseTime(cells[iT]) : null,
          players: iP >= 0 && parseInt(cells[iP], 10) > 0 ? parseInt(cells[iP], 10) : null,
          won: iW >= 0 && cells[iW] !== undefined && cells[iW].trim() !== '' ? parseFloat(cells[iW]) || 0 : null,
          winners: iWin >= 0 && cells[iWin] !== undefined && cells[iWin].trim() !== '' ? parseInt(cells[iWin], 10) || 0 : null,
          steer: iSt >= 0 && String(cells[iSt] || '').trim() !== '' ? /^(1|true|yes|y|да|тийм|magnet|соронз)$/i.test(String(cells[iSt]).trim()) : null,
          mult: iM >= 0 ? parseMult(cells[iM]) : null,
          light: iH >= 0 && String(cells[iH] || '').trim() !== '' ? /^(1|true|yes|y|да|тийм)$/i.test(String(cells[iH]).trim()) : null,
          multPartial: iPart >= 0 ? /^(1|true|yes)$/i.test(String(cells[iPart] || '').trim()) : false,
          liab: stakeCols.length ? liabilityFromStakes(stakes) : null,
        });
      }
      return { spins, errors };
    }
    return parsePlainList(text);
  }

  function parsePlainList(text) {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    const errors = [], spins = [];
    // Plain list: numbers separated by anything; a blank line, '#' or '---' starts a new session.
    // A number in parentheses landed on a multiplier number; when any parentheses are used, the
    // other numbers are taken as "no multiplier hit".
    const hasParens = /\(\s*\d/.test(text);
    let session = 1, sawNumber = false;
    lines.forEach((raw, li) => {
      const line = raw.trim();
      if (!line || line.startsWith('#') || /^-{3,}$/.test(line)) { if (sawNumber) { session++; sawNumber = false; } return; }
      const re = /\(\s*(\d{1,2})\s*(?:[x×:*]\s*(\d+))?\s*\)|(\d+)/g;
      let m;
      while ((m = re.exec(line))) {
        const inParens = m[1] != null;
        const n = parseInt(inParens ? m[1] : m[3], 10);
        if (!(n >= 0 && n <= 36)) { errors.push(`${li + 1}-р мөр: "${m[0]}" 0–36 биш.`); continue; }
        const k = m[2] ? parseInt(m[2], 10) : 0;
        spins.push({ n, session: String(session), dealer: '', dir: null, time: null, players: null, won: null, winners: null, steer: null,
          light: inParens ? true : (hasParens ? false : null), mult: k > 1 ? { [n]: k } : null, multPartial: inParens, liab: null });
        sawNumber = true;
      }
    });
    return { spins, errors };
  }

  // "13, 24, (23x100), 31" form, for copying a session back into the paste box.
  function spinsToText(spins) {
    return spins.map(s => {
      const k = s.mult && s.mult[s.n];
      return lightHit(s) ? `(${s.n}${k ? 'x' + k : ''})` : String(s.n);
    }).join(', ');
  }

  function spinsToCsv(spins) {
    const hasL = spins.some(s => s.liab);
    const hasDir = spins.some(s => s.dir), hasT = spins.some(s => s.time != null), hasP = spins.some(s => s.players != null);
    const hasW = spins.some(s => s.won != null), hasM = spins.some(s => s.mult), hasH = spins.some(s => s.light != null), hasPart = spins.some(s => s.multPartial), hasWin = spins.some(s => s.winners != null), hasSt = spins.some(s => s.steer != null);
    const head = ['number', 'session', 'dealer'];
    if (hasDir) head.push('direction');
    if (hasT) head.push('time');
    if (hasP) head.push('players');
    if (hasW) head.push('won');
    if (hasWin) head.push('winners');
    if (hasSt) head.push('steer');
    if (hasM) head.push('multipliers');
    if (hasH) head.push('hit');
    if (hasPart) head.push('mult_partial');
    if (hasL) for (let k = 0; k < N; k++) head.push('b' + k);
    const rows = [head.join(',')];
    spins.forEach(s => {
      const r = [s.n, s.session, s.dealer || ''];
      if (hasDir) r.push(s.dir === 'A' ? 'cw' : s.dir === 'B' ? 'ccw' : '');
      if (hasT) r.push(s.time == null ? '' : new Date(s.time).toISOString().slice(0, 19));
      if (hasP) r.push(s.players == null ? '' : s.players);
      if (hasW) r.push(s.won == null ? '' : s.won);
      if (hasWin) r.push(s.winners == null ? '' : s.winners);
      if (hasSt) r.push(s.steer == null ? '' : s.steer ? 1 : 0);
      if (hasM) r.push(multToStr(s.mult));
      if (hasH) r.push(s.light == null ? '' : s.light ? 1 : 0);
      if (hasPart) r.push(s.multPartial ? 1 : 0);
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

  const lightHit = s => (s.mult && !s.multPartial) ? !!s.mult[s.n] : s.light;

  function runTests(spins, opts) {
    opts = opts || {};
    const avgLightning = opts.avgLightning || 3;
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

    // Lightning-style games: multipliers are drawn after bets close, so on a fair wheel the ball
    // hits a multiplier number with probability (count of multiplier numbers) / 37. A house that
    // steers away from expensive numbers shows up as a deficit here. Normal approximation to the
    // Poisson-binomial; negative z = the ball avoids multiplier numbers.
    // When only "did it land on a multiplier number" is known, the count of multiplier numbers
    // that round is unknown and the configured average (default 3 of 37) stands in for it.
    function hitBand(label, arr) {
      let mean = 0, v = 0, obs = 0, assumed = 0;
      arr.forEach(s => {
        const full = s.mult && !s.multPartial;
        const q = (full ? Object.keys(s.mult).length : avgLightning) / N;
        if (!full) assumed++;
        mean += q; v += q * (1 - q); if (lightHit(s)) obs++;
      });
      const z = v > 0 ? (obs - mean) / Math.sqrt(v) : 0;
      return { label, n: arr.length, exp: mean, obs, z, assumed, p: arr.length ? twoSided(z) : 1 };
    }
    const withM = spins.filter(s => lightHit(s) != null);
    if (withM.length) {
      const full = withM.filter(s => s.mult && !s.multPartial);
      const maxM = s => Math.max(...Object.values(s.mult));
      const bands = [
        hitBand('Үржүүлэгч 100x хүртэл', full.filter(s => maxM(s) <= 100)),
        hitBand('Үржүүлэгч 101–500x', full.filter(s => maxM(s) > 100 && maxM(s) <= 500)),
        hitBand('Үржүүлэгч 500x-аас дээш', full.filter(s => maxM(s) > 500)),
      ].filter(b => b.n);
      out.lightning = Object.assign(hitBand('Бүгд', withM), { bands });
    }
    // Context bands: do things change with the number of players or the hour of day?
    const bandsOf = (arr, keyFn, labels) => labels.map((label, i) => { const sub = arr.filter(s => keyFn(s) === i); return { label, spins: sub }; }).filter(b => b.spins.length);
    const describe = b => {
      const sub = b.spins, c = new Array(N).fill(0);
      sub.forEach(s => c[s.n]++);
      const ee = sub.length / N;
      let x = 0; for (let k = 0; k < N; k++) x += (c[k] - ee) ** 2 / (ee || 1);
      const pl = sub.filter(s => s.players != null), wn = sub.filter(s => s.won != null), lm = sub.filter(s => lightHit(s) != null);
      const wi = sub.filter(s => s.winners != null), ws = sub.filter(s => s.winners != null && s.players > 0);
      return {
        label: b.label, n: sub.length, uniformP: sub.length ? chi2p(x, 36) : 1,
        players: pl.length ? pl.reduce((a, s) => a + s.players, 0) / pl.length : null,
        won: wn.length ? wn.reduce((a, s) => a + s.won, 0) / wn.length : null,
        winners: wi.length ? wi.reduce((a, s) => a + s.winners, 0) / wi.length : null,
        winShare: ws.length ? ws.reduce((a, s) => a + s.winners / s.players, 0) / ws.length : null,
        lightning: lm.length ? hitBand(b.label, lm) : null,
      };
    };
    const withT = spins.filter(s => s.time != null);
    if (withT.length) {
      const hour = s => new Date(s.time).getUTCHours();
      out.byHour = bandsOf(withT, s => Math.floor(hour(s) / 4), ['00–03', '04–07', '08–11', '12–15', '16–19', '20–23']).map(describe);
    }
    const withP = spins.filter(s => s.players != null);
    if (withP.length >= 30) {
      const ps = withP.map(s => s.players).sort((a, b) => a - b);
      const q1 = ps[Math.floor(ps.length / 3)], q2 = ps[Math.floor(2 * ps.length / 3)];
      out.byPlayers = bandsOf(withP, s => (s.players < q1 ? 0 : s.players < q2 ? 1 : 2), [`Цөөн (${q1}-аас доош)`, `Дунд (${q1}–${q2 - 1})`, `Олон (${q2}+)`]).map(describe);
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

  // Where the crowd's money probably sits, estimated from the outcome history alone with
  // the habits the gambling literature documents. Each feature is a 37-vector, standardized.
  const POPULAR = new Float64Array(N);
  [17, 7, 23, 24, 3, 11, 0, 13, 20, 8].forEach((n, i) => { POPULAR[n] += 1 - i * 0.07; });
  for (let k = 1; k <= 31; k++) POPULAR[k] += 0.4; // birthdays
  const PSYCH_FEATURES = [
    { id: 'colorStreak', label: 'Өнгөний цуваа', hint: 'Нэг өнгө 2+ удаа дараалсны дараа олон эсрэг өнгөнд тавьдаг.' },
    { id: 'halfStreak', label: 'Бага/их цуваа', hint: '1–18 эсвэл 19–36 дараалсны дараа эсрэг талд тавьдаг.' },
    { id: 'parityStreak', label: 'Тэгш/сондгой цуваа', hint: 'Тэгш эсвэл сондгой дараалсны дараа эсрэгт нь тавьдаг.' },
    { id: 'recent', label: 'Саяхан буусан тоо', hint: 'Сүүлийн 5 эргэлтэд буусан тоонд “давтана” гэж тавьдаг.' },
    { id: 'overdue', label: '“Удсан” тоо', hint: 'Удаан буугаагүй тоонд “ээлж нь ирлээ” гэж тавьдаг.' },
    { id: 'hot', label: 'Халуун тоо', hint: 'Сүүлийн 37 эргэлтэд олон буусан тоонд тавьдаг.' },
    { id: 'popular', label: 'Алдартай тоо', hint: '17, 7, 23, 24, 0 болон төрсөн өдрийн тоонууд (1–31).' },
    { id: 'neighbors', label: 'Өмнөх тооны хөрш', hint: 'Дугуй дээр өмнөх тооны хажуугийн нүднүүдэд тавьдаг.' },
  ];
  function streakOf(hist, fn) {
    let c = null, L = 0;
    for (let i = hist.length - 1; i >= 0; i--) {
      const v = fn(hist[i]);
      if (v == null) break;
      if (c == null) c = v;
      if (v !== c) break;
      L++;
    }
    return { c, L };
  }
  function psychFeatures(ctx) {
    const hist = ctx.hist || [];
    const F = [];
    const streakFeature = fn => {
      const st = streakOf(hist, fn), f = new Float64Array(N);
      if (st.L >= 2) { const L = Math.min(st.L, 6); for (let k = 0; k < N; k++) { const v = fn(k); if (v != null) f[k] = v === st.c ? -L : L; } }
      return f;
    };
    F.push(streakFeature(n => (n === 0 ? null : colorOf(n))));
    F.push(streakFeature(n => (n === 0 ? null : n >= 19 ? 'H' : 'L')));
    F.push(streakFeature(n => (n === 0 ? null : n % 2 ? 'O' : 'E')));
    const recent = new Float64Array(N); hist.slice(-5).forEach(n => { recent[n] = 1; }); F.push(recent);
    const overdue = new Float64Array(N); for (let k = 0; k < N; k++) overdue[k] = Math.log1p(ctx.gaps[k]); F.push(overdue);
    const hot = new Float64Array(N); hist.slice(-37).forEach(n => { hot[n] += 1; }); F.push(hot);
    F.push(POPULAR);
    const nb = new Float64Array(N);
    if (ctx.prev != null) for (let k = 0; k < N; k++) { const d = wheelDist(ctx.prev, k); if (k !== ctx.prev && (d <= 2 || d >= N - 2)) nb[k] = 1; }
    F.push(nb);
    return F.map(standardize);
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
    psych: { label: 'Олны сэтгэл зүй', hint: 'Тоглогчид хаана их тавьж байгааг зуршлаас нь тооцоолж, үр дүн тэдний талд уу, эсрэг үү гэдгийг сурна.' },
    magnet: { label: 'Соронз', hint: 'Таны “соронзолсон” гэж тэмдэглэсэн эргэлтүүдээс хэзээ соронзолдог, тэр үед хаана буудгийг сурна. Тэмдэглэгээгүй бол идэвхгүй.' },
    payout: { label: 'Хожлын дүн', hint: 'Бүртгэсэн хожлын дүнгээс ямар тоо их төлдгийг сураад, казино бага төлөх тоо руу чиглүүлдэг эсэхийг шалгана. Хожлын дүн оруулаагүй бол идэвхгүй.' },
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
    const pw = new Float64Array(PSYCH_FEATURES.length);
    // Payout regression: log(won) ≈ pay0 + Σ payW·feature(outcome); learned only from spins with a won amount.
    const payW = new Float64Array(PSYCH_FEATURES.length);
    let pay0 = 0, payN = 0, payBeta = 0;
    // Magnet model: a logistic P(steered | context) and a softmax over the crowd-habit features
    // for where a steered ball lands. Both learn only from spins the user tagged.
    const MF = 9; // intercept, prev steered, 2nd prev, colour streak, last won z, recent won z, hour sin/cos, players z
    const mgW = new Float64Array(MF), mgOut = new Float64Array(PSYCH_FEATURES.length);
    let mgN = 0, mgPos = 0, mgOutN = 0;
    const magnetFeatures = ctx => {
      const f = new Float64Array(MF);
      f[0] = 1; f[1] = ctx.prevSteer === true ? 1 : ctx.prevSteer === false ? -1 : 0; f[2] = ctx.prevSteer2 === true ? 1 : ctx.prevSteer2 === false ? -1 : 0;
      f[3] = Math.min(6, streakOf(ctx.hist || [], n => (n === 0 ? null : colorOf(n))).L) / 3;
      f[4] = ctx.lastWonZ || 0; f[5] = ctx.recentWonZ || 0;
      if (ctx.hour != null) { f[6] = Math.sin(ctx.hour / 24 * 2 * Math.PI); f[7] = Math.cos(ctx.hour / 24 * 2 * Math.PI); }
      f[8] = ctx.playersZ || 0;
      return f;
    };
    const magnetP = f => { let z = 0; for (let j = 0; j < MF; j++) z += mgW[j] * f[j]; return 1 / (1 + Math.exp(-z)); };
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
        id: 'psych',
        predict(ctx) {
          const F = ctx._psychF || (ctx._psychF = psychFeatures(ctx));
          const p = new Float64Array(N);
          let mx = -Infinity;
          for (let k = 0; k < N; k++) { let v = 0; for (let j = 0; j < F.length; j++) v += pw[j] * F[j][k]; p[k] = v; if (v > mx) mx = v; }
          for (let k = 0; k < N; k++) p[k] = Math.exp(p[k] - mx);
          return normalize(p);
        },
        update(ctx, y) {
          const F = ctx._psychF || psychFeatures(ctx), p = this.predict(ctx);
          // Log-loss gradient; the step shrinks as evidence accumulates.
          const step = Math.max(0.01, 0.05 / Math.sqrt(1 + ctx.step / 200));
          for (let j = 0; j < F.length; j++) {
            let ez = 0; for (let k = 0; k < N; k++) ez += p[k] * F[j][k];
            pw[j] = Math.max(-3, Math.min(3, pw[j] + step * (F[j][y] - ez)));
          }
        },
        param: () => Array.from(pw),
      },
      {
        id: 'magnet',
        predict(ctx) {
          if (mgN < 10) return uniformP();
          const ps = magnetP(magnetFeatures(ctx));
          const F = ctx._psychF || (ctx._psychF = psychFeatures(ctx));
          const q = new Float64Array(N);
          let mx = -Infinity;
          for (let k = 0; k < N; k++) { let v = 0; for (let j = 0; j < F.length; j++) v += mgOut[j] * F[j][k]; q[k] = v; if (v > mx) mx = v; }
          for (let k = 0; k < N; k++) q[k] = Math.exp(q[k] - mx);
          normalize(q);
          const p = new Float64Array(N);
          for (let k = 0; k < N; k++) p[k] = ps * q[k] + (1 - ps) / N;
          return p;
        },
        update(ctx, y) {
          if (ctx.steer == null) return;
          const f = magnetFeatures(ctx), ps = magnetP(f), step = Math.max(0.01, 0.1 / Math.sqrt(1 + mgN / 50));
          const g = (ctx.steer ? 1 : 0) - ps;
          for (let j = 0; j < MF; j++) mgW[j] = Math.max(-4, Math.min(4, mgW[j] + step * g * f[j]));
          mgN++; if (ctx.steer) mgPos++;
          if (!ctx.steer) return;
          // Where steered balls land, as a softmax over the crowd-habit features.
          const F = ctx._psychF || (ctx._psychF = psychFeatures(ctx));
          const q = new Float64Array(N);
          let mx = -Infinity;
          for (let k = 0; k < N; k++) { let v = 0; for (let j = 0; j < F.length; j++) v += mgOut[j] * F[j][k]; q[k] = v; if (v > mx) mx = v; }
          for (let k = 0; k < N; k++) q[k] = Math.exp(q[k] - mx);
          normalize(q);
          const st2 = Math.max(0.01, 0.06 / Math.sqrt(1 + mgOutN / 50));
          for (let j = 0; j < F.length; j++) { let ez = 0; for (let k = 0; k < N; k++) ez += q[k] * F[j][k]; mgOut[j] = Math.max(-3, Math.min(3, mgOut[j] + st2 * (F[j][y] - ez))); }
          mgOutN++;
        },
        param: () => ({ n: mgN, pos: mgPos, w: Array.from(mgW), out: Array.from(mgOut), pNext: null }),
        // P(next spin steered) for the forecast, filled in by walkForward.
        steerProb(ctx) { return mgN >= 10 ? magnetP(magnetFeatures(ctx)) : null; },
      },
      {
        id: 'payout',
        predict(ctx) {
          if (payN < 20) return uniformP();
          const F = ctx._psychF || (ctx._psychF = psychFeatures(ctx));
          const P = new Float64Array(N);
          for (let k = 0; k < N; k++) { let v = pay0; for (let j = 0; j < F.length; j++) v += payW[j] * F[j][k]; P[k] = v; }
          return softmaxNeg(standardize(P), payBeta);
        },
        update(ctx, y) {
          // Multiplier wins inflate the payout for reasons unrelated to the crowd; skip them.
          if (ctx.won == null || ctx.lightHit) return;
          const F = ctx._psychF || (ctx._psychF = psychFeatures(ctx));
          const target = Math.log1p(Math.max(0, ctx.won));
          let pred = pay0; for (let j = 0; j < F.length; j++) pred += payW[j] * F[j][y];
          const err = target - pred, step = Math.max(0.005, 0.05 / Math.sqrt(1 + payN / 50));
          pay0 += step * err;
          for (let j = 0; j < F.length; j++) payW[j] = Math.max(-3, Math.min(3, payW[j] + step * err * F[j][y]));
          payN++;
          if (payN < 20) return;
          const P = new Float64Array(N);
          for (let k = 0; k < N; k++) { let v = pay0; for (let j = 0; j < F.length; j++) v += payW[j] * F[j][k]; P[k] = v; }
          const z = standardize(P), p = softmaxNeg(z, payBeta);
          let ez = 0; for (let k = 0; k < N; k++) ez += p[k] * z[k];
          // Positive beta = the ball favours numbers the regression expects to pay little.
          payBeta = Math.max(-3, Math.min(3, payBeta + lr * (ez - z[y])));
        },
        param: () => ({ beta: payBeta, n: payN, w: Array.from(payW) }),
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

  // straightRet: total return per unit on a winning straight-up bet (36 = standard, 20 = lightning-style).
  const DEFAULT_CFG = { decay: 0.999, share: 0.01, eta: 1, lr: 0.03, margin: 0.1, maxBets: 3, straightRet: 36 };

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
    let prev = null, prevSession = null, hist = [];
    let prevSteer = null, prevSteer2 = null;
    const wonLog = [];
    let wonMean = 0, wonM2 = 0, wonN = 0;
    const wonZ = v => (wonN > 5 && wonM2 > 0 ? (Math.log1p(v) - wonMean) / Math.sqrt(wonM2 / (wonN - 1)) : 0);
    let plMean = 0, plM2 = 0, plN = 0;
    const playersZ = v => (plN > 5 && plM2 > 0 ? (v - plMean) / Math.sqrt(plM2 / (plN - 1)) : 0);
    const context = (s, t, newSession) => {
      const recent = wonLog.slice(-5);
      return {
        prevSteer, prevSteer2,
        lastWonZ: wonLog.length ? wonZ(wonLog[wonLog.length - 1]) : 0,
        recentWonZ: recent.length ? recent.reduce((a, v) => a + wonZ(v), 0) / recent.length : 0,
        hour: s && s.time != null ? new Date(s.time).getUTCHours() : null,
        playersZ: s && s.players != null ? playersZ(s.players) : 0,
      };
    };
    for (let t = 0; t < spins.length; t++) {
      const s = spins[t];
      if (s.session !== prevSession) { prev = null; hist = []; prevSteer = null; prevSteer2 = null; }
      const ctx = Object.assign({ prev, liab: s.liab, gaps, step: t, dir: dirs[t], hist, newSession: s.session !== prevSession, won: s.won, lightHit: !!lightHit(s), steer: s.steer }, context(s, t));
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
        // Multipliers are unknown when the bet is placed but are paid when the number hits.
        const picks = order.filter(o => cfg.straightRet * o.v - 1 > cfg.margin).slice(0, cfg.maxBets);
        picks.forEach(o => { bets++; expectedHits += 1 / N; if (o.k === y) { hits++; bankroll += ((s.mult && s.mult[y]) || cfg.straightRet) - 1; } else bankroll -= 1; });
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
      hist.push(y); if (hist.length > 120) hist.shift();
      prevSteer2 = prevSteer; prevSteer = s.steer;
      if (s.won != null && !lightHit(s)) { const v = Math.log1p(Math.max(0, s.won)); wonN++; const d = v - wonMean; wonMean += d / wonN; wonM2 += d * (v - wonMean); wonLog.push(s.won); if (wonLog.length > 50) wonLog.shift(); }
      if (s.players != null) { plN++; const d = s.players - plMean; plMean += d / plN; plM2 += d * (s.players - plMean); }
    }
    // Forecast for the spin that has not happened yet (same session, stakes unknown).
    let next = null;
    if (opts.next) {
      const t = spins.length, dir = t && spins[t - 1].dir ? null : (t % 2 ? 'B' : 'A');
      const last = spins[spins.length - 1] || null;
      const ctx = Object.assign({ prev, liab: null, gaps, step: t, dir: dir || 'A', hist, newSession: t === 0 }, context(last && { time: last.time != null ? last.time + 45000 : null, players: last.players }, t));
      const preds = models.map(m => m.predict(ctx));
      const p = new Float64Array(N);
      for (let i = 0; i < K; i++) for (let k = 0; k < N; k++) p[k] += w[i] * preds[i][k];
      const mg = models.find(m => m.id === 'magnet');
      next = { p: Array.from(p), steerProb: mg ? mg.steerProb(ctx) : null, models: models.map((m, i) => ({ id: m.id, weight: w[i], p: Array.from(preds[i]) })) };
    }
    return {
      next, cfg, scored, bits, bitsPerSpin: scored ? bits / scored : 0,
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
      const sh = spins.map(s => Object.assign({}, s, { n: Math.floor(r() * N) }));
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
    const straightRet = opts.straightRet || 36;
    [1, 0.999, 0.99].forEach(decay => [0.002, 0.02, 0.08].forEach(share => grid.push({ decay, share, lr: 0.05, straightRet })));
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
    o = Object.assign({ spins: 3000, sessions: 30, wheel: 'fair', bias: 0.25, house: 0.3, steer: 0.35, players: 12, seed: 42, game: 'standard' }, o);
    const lightning = o.game === 'lightning';
    const straightRet = lightning ? 20 : 36;
    const MULTS = [50, 50, 50, 100, 100, 100, 100, 200, 300, 400, 500];
    const t0 = Date.UTC(2026, 0, 1, 18, 0, 0);
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
      // Lightning numbers are drawn before the ball is launched but after bets close.
      let mult = null;
      if (lightning) {
        mult = {};
        const k = 1 + Math.floor(r() * 5);
        for (let i = 0; i < k; i++) {
          const num = Math.floor(r() * N);
          mult[num] = r() < 0.03 ? (r() < 0.5 ? 1000 : 2000) : MULTS[Math.floor(r() * MULTS.length)];
        }
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
        else L[pick] += ((mult && mult[pick]) || straightRet) * stake;
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
      // Crowd size and the hour drift over the day so the context tests have something to look at.
      spins.push({ n: y, session, dealer: o.wheel === 'dealer' ? 'D1' : '', dir: null, time: t0 + t * 45000, players: bets.length, won: L[y], mult, liab: L });
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
    return { spins, log, truth: { players: Object.fromEntries(players.map(p => [p.id, p.type])), wheel: o.wheel, rigged: Array.from(rigged), biasPockets: Array.from(biasPockets), sigD, sigD2, game: o.game } };
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

  // How the user's "steered" tags relate to context: streaks, payouts, hour, clustering, landing zone.
  function steerStats(spins) {
    const tagged = spins.filter(s => s.steer != null);
    if (tagged.length < 5) return null;
    const steered = tagged.filter(s => s.steer), natural = tagged.filter(s => !s.steer);
    const med = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
    const wonOf = a => a.filter(s => s.won != null && !lightHit(s)).map(s => s.won);
    const out = { n: tagged.length, steered: steered.length, share: steered.length / tagged.length, wonSteered: med(wonOf(steered)), wonNatural: med(wonOf(natural)) };
    // Clustering: P(steered | previous tagged spin steered) vs after a natural one.
    let aS = 0, nS = 0, aN = 0, nN = 0;
    for (let i = 1; i < spins.length; i++) {
      const a = spins[i - 1], b = spins[i];
      if (a.session !== b.session || a.steer == null || b.steer == null) continue;
      if (a.steer) { nS++; if (b.steer) aS++; } else { nN++; if (b.steer) aN++; }
    }
    out.afterSteered = nS ? aS / nS : null; out.afterNatural = nN ? aN / nN : null; out.nAfterSteered = nS; out.nAfterNatural = nN;
    // After a colour streak of two or more.
    let sS = 0, sN = 0, oS = 0, oN = 0;
    for (let i = 2; i < spins.length; i++) {
      const s = spins[i];
      if (s.steer == null) continue;
      const a = colorOf(spins[i - 2].n), b = colorOf(spins[i - 1].n);
      const streak = a !== 'G' && a === b && spins[i - 1].session === s.session && spins[i - 2].session === s.session;
      if (streak) { sN++; if (s.steer) sS++; } else { oN++; if (s.steer) oS++; }
    }
    out.afterStreak = sN ? sS / sN : null; out.noStreak = oN ? oS / oN : null; out.nStreak = sN; out.nNoStreak = oN;
    // After a big payout (above the median of tagged spins' payouts).
    const wons = wonOf(tagged), m = med(wons);
    if (m != null) {
      let bS = 0, bN = 0, lS = 0, lN = 0;
      for (let i = 1; i < spins.length; i++) {
        const a = spins[i - 1], b = spins[i];
        if (b.steer == null || a.won == null || a.session !== b.session) continue;
        if (a.won > m) { bN++; if (b.steer) bS++; } else { lN++; if (b.steer) lS++; }
      }
      out.afterBigWin = bN ? bS / bN : null; out.afterSmallWin = lN ? lS / lN : null; out.nBig = bN; out.nSmall = lN;
    }
    // By hour and by wheel quarter.
    const hours = {};
    tagged.filter(s => s.time != null).forEach(s => { const h = Math.floor(new Date(s.time).getUTCHours() / 4); hours[h] = hours[h] || { n: 0, s: 0 }; hours[h].n++; if (s.steer) hours[h].s++; });
    out.byHour = Object.keys(hours).sort().map(h => ({ label: `${h * 4}–${h * 4 + 3}`, n: hours[h].n, share: hours[h].s / hours[h].n }));
    const quarters = [0, 0, 0, 0], qAll = [0, 0, 0, 0];
    steered.forEach(s => quarters[Math.floor(POS[s.n] * 4 / 37)]++);
    spins.forEach(s => qAll[Math.floor(POS[s.n] * 4 / 37)]++);
    out.quarters = quarters.map((c, i) => ({ i, steered: c, all: qAll[i] }));
    const colors = { R: 0, B: 0, G: 0 }; steered.forEach(s => colors[colorOf(s.n)]++); out.colors = colors;
    out.lightSteered = steered.filter(s => lightHit(s)).length;
    return out;
  }

  const api = {
    N, WHEEL, POS, colorOf, wheelDist, OUTSIDE, rng,
    chi2p, normSf, binomSf,
    parseSpins, spinsToCsv, spinsToText, parseMult, multToStr, parseTime, runTests,
    MODEL_INFO, DEFAULT_CFG, walkForward, nullRuns, train,
    PLAYER_TYPES, simulate, parsePlayerLog, playerLogToCsv, analyzePlayers, PSYCH_FEATURES, lightHit, steerStats,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PL = api;
})(typeof window !== 'undefined' ? window : globalThis);
