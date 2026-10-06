// Лангуу engine: synthetic market history, demand forecasting, customer behaviour, price
// intelligence and basket optimisation. Pure functions over plain data, no DOM, so the same
// code runs in the page, in a worker, in Node tests, and in other domains (any "who buys
// what, when, from whom" problem) by swapping the entity names.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.ZE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- utilities ----------
  function rng(seed) { let a = (seed >>> 0) || 1; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const mean = a => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
  const median = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const quantile = (a, q) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); const i = Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1)))); return s[i]; };
  const sum = a => a.reduce((s, v) => s + v, 0);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const round1 = v => Math.round(v * 10) / 10;
  const normCdf = z => 0.5 * (1 + erf(z / Math.SQRT2));
  function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  const DAY = 86400000;
  const WEEKDAYS = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];

  // ---------- synthetic market ----------
  const BUYER_TYPES = {
    restaurant: { label: 'Ресторан', n: 8, orderP: [0.55, 0.85, 0.8, 0.8, 0.85, 0.95, 0.75], basket: 9, qty: 1.6, loyalty: 0.7, priceSens: 0.4 },
    shop: { label: 'Дэлгүүр', n: 7, orderP: [0.35, 0.6, 0.45, 0.6, 0.45, 0.7, 0.5], basket: 7, qty: 2.4, loyalty: 0.45, priceSens: 0.8 },
    canteen: { label: 'Гуанз, цайны газар', n: 5, orderP: [0.2, 0.9, 0.6, 0.6, 0.6, 0.9, 0.3], basket: 6, qty: 1.2, loyalty: 0.8, priceSens: 0.3 },
    household: { label: 'Айл өрх', n: 10, orderP: [0.3, 0.08, 0.08, 0.12, 0.1, 0.2, 0.35], basket: 4, qty: 0.3, loyalty: 0.3, priceSens: 1.0 },
  };
  const BUYER_NAMES = ['Нарны гуанз', 'Хаан буузны газар', 'Гоёо ресторан', 'Таван богд дэлгүүр', 'Сайн хүнс', 'Номин маркет', 'Тэнгэр цайны газар', 'Болд гуанз', 'Их Монгол ресторан', 'Алтан говь', 'Хишиг дэлгүүр', 'Мөнх хүнс', 'Баян цайны газар', 'Од ресторан', 'Эрдэнэ дэлгүүр', 'Бат-Эрдэнэ', 'Сарангэрэл', 'Оюунчимэг', 'Энхбаяр', 'Нарантуяа', 'Ганбат', 'Цэцэгмаа', 'Болормаа', 'Мөнхбат', 'Дулмаа', 'Тэмүүлэн', 'Алтанцэцэг', 'Жаргал', 'Хонгорзул', 'Анар'];

  // Seller personalities decide the patterns the models should find.
  const SELLER_TRAITS = {
    s1: { out: 0.03, drift: 0.01, quality: 4.6, bait: false },          // steady, slightly dear
    s2: { out: 0.04, drift: 0.015, quality: 4.3, bait: false },         // cheap on staples, reliable
    s3: { out: 0.06, drift: 0.02, quality: 4.7, bait: false },          // best fruit and veg quality
    s4: { out: 0.18, drift: 0.03, quality: 3.6, bait: true },           // cheapest, often sold out after winning
    s5: { out: 0.05, drift: 0.01, quality: 4.4, bait: false },          // meat and dry goods
  };
  const SEASON = { p6: 0.012, p7: 0.01, p10: -0.004, p12: 0.006, p13: 0.004 }; // daily price trend over the window
  // Typical quantity a restaurant takes per order, by product (kg, trays, pieces, sacks).
  const QTY_SCALE = { p1: 25, p2: 12, p3: 15, p4: 12, p5: 2, p6: 6, p7: 5, p8: 3, p9: 6, p10: 8, p11: 6, p12: 5, p13: 1.5, p14: 12, p15: 10, p16: 8, p17: 4, p18: 20, p19: 2, p20: 2, p21: 1, p22: 3, p23: 8 };

  function synth(opts) {
    const o = Object.assign({ days: 90, seed: 7 }, opts || {});
    const r = rng(o.seed);
    const { sellers, products, offers } = o;
    const today = o.today || Date.now();
    const t0 = today - o.days * DAY;
    // Buyers with habits.
    const buyers = [];
    let ni = 0;
    Object.entries(BUYER_TYPES).forEach(([type, T]) => {
      for (let i = 0; i < T.n; i++) {
        const pool = products.filter(p => (type === 'household' ? p.cat !== 'Хуурай хүнс' || r() < 0.3 : true));
        const basket = pool.slice().sort(() => r() - 0.5).slice(0, T.basket).map(p => ({ productId: p.id, qty: Math.max(0.5, round1(T.qty * (QTY_SCALE[p.id] || 5) * (0.6 + r() * 0.8))), p: 0.5 + r() * 0.5 }));
        const fav = {};
        basket.forEach(b => { const os = offers.filter(x => x.productId === b.productId); if (os.length) fav[b.productId] = os[Math.floor(r() * os.length)].sellerId; });
        const pause = r() < 0.25 ? { from: Math.floor(r() * (o.days - 20)) + 5, len: 5 + Math.floor(r() * 12) } : null; // holidays, renovation
        buyers.push({ id: 'b' + (buyers.length + 1), name: BUYER_NAMES[ni++ % BUYER_NAMES.length], type, basket, fav, loyalty: T.loyalty * (0.7 + r() * 0.6), priceSens: T.priceSens * (0.6 + r() * 0.8), pause, lost: r() < 0.12 ? o.days - Math.floor(r() * 25) - 1 : null });
      }
    });
    // Daily prices: random walk per offer around its listed price, plus seasonal trends and a market shock.
    const base = {}; offers.forEach(x => { base[x.id] = x.price; });
    const shockDay = Math.floor(o.days * 0.55), shockProd = 'p4';
    const priceHistory = []; // {day, offerId, price, stock}
    const history = [];
    let seq = 1;
    const lvl = {}; offers.forEach(x => { lvl[x.id] = 1; });
    for (let d = 0; d < o.days; d++) {
      const date = new Date(t0 + d * DAY), wd = date.getDay();
      const dayPrice = {}, dayStock = {};
      offers.forEach(x => {
        const tr = SELLER_TRAITS[x.sellerId] || SELLER_TRAITS.s1;
        lvl[x.id] = clamp(lvl[x.id] * (1 + gauss(r) * tr.drift) + (1 - lvl[x.id]) * 0.05, 0.75, 1.35);
        let m = lvl[x.id] * (1 + (SEASON[x.productId] || 0) * (d - o.days / 2));
        if (x.productId === shockProd && d >= shockDay && d < shockDay + 12) m *= 1.35; // onion shortage
        const price = Math.round(base[x.id] * m / 50) * 50;
        const outP = tr.out * (wd === 1 ? 1.6 : 1) * (x.productId === shockProd && d >= shockDay && d < shockDay + 12 ? 2.5 : 1);
        dayPrice[x.id] = price; dayStock[x.id] = r() > outP;
        priceHistory.push({ day: d, offerId: x.id, price, stock: dayStock[x.id] });
      });
      buyers.forEach(b => {
        if (b.lost != null && d >= b.lost) return;
        if (b.pause && d >= b.pause.from && d < b.pause.from + b.pause.len) return;
        const T = BUYER_TYPES[b.type];
        const last = b._last == null ? 99 : d - b._last;
        let p = T.orderP[wd] * (last === 0 ? 0 : last === 1 ? 0.75 : 1) + (last >= 4 ? 0.15 : 0);
        if (b.type === 'household') p = T.orderP[wd] * (last < 4 ? 0.2 : 1);
        if (d === shockDay - 1 && r() < 0.5) p = Math.max(p, 0.8); // stocking up before the shortage
        if (r() > p) return;
        b._last = d;
        const items = [];
        b.basket.forEach(bi => {
          if (r() > bi.p) return;
          const os = offers.filter(x => x.productId === bi.productId);
          if (!os.length) return;
          const scored = os.map(x => { const tr = SELLER_TRAITS[x.sellerId]; const cheapest = Math.min(...os.map(y => dayPrice[y.id])); const rel = (dayPrice[x.id] - cheapest) / cheapest; return { x, score: -b.priceSens * rel * 10 + (x.sellerId === b.fav[bi.productId] ? b.loyalty * 2 : 0) + tr.quality * 0.15 * (1 - b.priceSens) + gauss(r) * 0.4 }; }).sort((a, c) => c.score - a.score);
          const pick = scored[0].x;
          const qty = round1(Math.max(0.5, bi.qty * (0.7 + r() * 0.6) * (wd === 5 || wd === 6 ? 1.25 : 1)));
          let status = dayStock[pick.id] ? 'ok' : 'out';
          const tr = SELLER_TRAITS[pick.sellerId];
          if (tr.bait && status === 'ok' && dayPrice[pick.id] <= Math.min(...os.map(y => dayPrice[y.id])) && r() < 0.22) status = 'out'; // wins with a low price, then "sold out"
          items.push({ productId: bi.productId, sellerId: pick.sellerId, offerId: pick.id, qty, price: dayPrice[pick.id], status });
        });
        if (!items.length) return;
        history.push({ id: 'h' + seq++, day: d, at: t0 + d * DAY + (8 + Math.floor(r() * 10)) * 3600000, buyerId: b.id, type: b.type, items, rating: Object.fromEntries([...new Set(items.map(i => i.sellerId))].map(s => [s, clamp(Math.round(SELLER_TRAITS[s].quality + gauss(r) * 0.6), 1, 5)])) });
      });
    }
    buyers.forEach(b => { delete b._last; });
    return { buyers, history, priceHistory, days: o.days, t0, today, shock: { day: shockDay, productId: shockProd } };
  }

  // ---------- series forecasting: walk-forward mixture of simple experts ----------
  const EXPERTS = [
    { id: 'last', label: 'Өчигдрийнх', f: (y, d) => y[d - 1] },
    { id: 'avg7', label: '7 хоногийн дундаж', f: (y, d) => mean(y.slice(Math.max(0, d - 7), d)) },
    { id: 'med7', label: '7 хоногийн медиан', f: (y, d) => median(y.slice(Math.max(0, d - 7), d)) },
    { id: 'wday', label: 'Ижил гарагийн дундаж', f: (y, d, wd) => { const v = []; for (let k = d - 7; k >= 0 && v.length < 4; k -= 7) v.push(y[k]); return v.length ? mean(v) : mean(y.slice(Math.max(0, d - 7), d)); } },
    { id: 'ewma', label: 'Экспоненциал гулсах', f: (y, d, wd, st) => { if (st.s == null) st.s = y[0]; return st.s; }, upd: (y, d, st) => { st.s = st.s == null ? y[d] : 0.3 * y[d] + 0.7 * st.s; } },
    { id: 'trend', label: '14 хоногийн чиг хандлага', f: (y, d) => { const w = y.slice(Math.max(0, d - 14), d); if (w.length < 4) return mean(w); const n = w.length, xs = mean(w.map((_, i) => i)), ys = mean(w); let num = 0, den = 0; w.forEach((v, i) => { num += (i - xs) * (v - ys); den += (i - xs) ** 2; }); const b = den ? num / den : 0; return Math.max(0, ys + b * (n - xs)); } },
    { id: 'wdayTrend', label: 'Гараг × хандлага', f: (y, d, wd) => { const w = y.slice(Math.max(0, d - 28), d); if (w.length < 14) return mean(y.slice(Math.max(0, d - 7), d)); const m = mean(w); const same = []; for (let k = d - 7; k >= Math.max(0, d - 28); k -= 7) same.push(y[k]); const r7 = mean(y.slice(d - 7, d)); return m ? Math.max(0, mean(same) * (r7 / m)) : r7; } },
  ];
  // y: daily values; wdays: weekday per index. Returns tomorrow's forecast, the next 7 days, skill vs naive.
  function forecastSeries(y, wdays, opts) {
    opts = opts || {};
    const n = y.length, K = EXPERTS.length, eta = opts.eta || 0.3;
    if (n < 3) { const m = mean(y); return { next: m, lo: m * 0.5, hi: m * 1.5, week: Array(7).fill(m), mae: null, naiveMae: null, skill: 0, weights: EXPERTS.map(e => ({ id: e.id, label: e.label, w: 1 / K })), scored: 0 }; }
    const st = EXPERTS.map(() => ({}));
    const loss = new Float64Array(K);
    const w = new Float64Array(K).fill(1 / K);
    const scale = Math.max(1e-9, mean(y) || 1);
    let errs = [], naiveErrs = [], resid = [];
    const from = Math.min(14, Math.floor(n / 2));
    for (let d = 1; d < n; d++) {
      const preds = EXPERTS.map((e, i) => Math.max(0, e.f(y, d, wdays[d], st[i])) || 0);
      let p = 0; for (let i = 0; i < K; i++) p += w[i] * preds[i];
      if (d >= from) { errs.push(Math.abs(p - y[d])); naiveErrs.push(Math.abs(mean(y.slice(Math.max(0, d - 7), d)) - y[d])); resid.push(y[d] - p); }
      for (let i = 0; i < K; i++) loss[i] = 0.97 * loss[i] + Math.abs(preds[i] - y[d]) / scale;
      let mx = Infinity; for (let i = 0; i < K; i++) mx = Math.min(mx, loss[i]);
      let sw = 0; for (let i = 0; i < K; i++) { w[i] = Math.exp(-eta * (loss[i] - mx) * 5); sw += w[i]; }
      for (let i = 0; i < K; i++) w[i] /= sw;
      EXPERTS.forEach((e, i) => { if (e.upd) e.upd(y, d, st[i]); });
    }
    // Tomorrow and the week after: roll the series forward with its own forecasts.
    const yy = y.slice(), ww = wdays.slice(), week = [];
    for (let h = 0; h < 7; h++) {
      const d = yy.length, wd = (ww[d - 1] + 1) % 7;
      const preds = EXPERTS.map((e, i) => Math.max(0, e.f(yy, d, wd, st[i])) || 0);
      let p = 0; for (let i = 0; i < K; i++) p += w[i] * preds[i];
      week.push(p); yy.push(p); ww.push(wd);
      EXPERTS.forEach((e, i) => { if (e.upd) e.upd(yy, d, st[i]); });
    }
    const mae = errs.length ? mean(errs) : null, naiveMae = naiveErrs.length ? mean(naiveErrs) : null;
    const lo = resid.length ? quantile(resid, 0.15) : -week[0] * 0.3, hi = resid.length ? quantile(resid, 0.85) : week[0] * 0.3;
    return { next: week[0], lo: Math.max(0, week[0] + lo), hi: week[0] + hi, week, mae, naiveMae, skill: naiveMae ? 1 - mae / naiveMae : 0, weights: EXPERTS.map((e, i) => ({ id: e.id, label: e.label, w: w[i] })), scored: errs.length };
  }

  // Daily quantity series for a product (optionally one seller) from the history.
  function dailySeries(history, days, filter) {
    const y = new Array(days).fill(0);
    history.forEach(h => { if (h.day < 0 || h.day >= days) return; h.items.forEach(it => { if (filter(it, h)) y[h.day] += it.qty; }); });
    return y;
  }
  const weekdaysFrom = (t0, days) => Array.from({ length: days }, (_, d) => new Date(t0 + d * DAY).getDay());

  // ---------- customers: who orders tomorrow, who is slipping away ----------
  const GAP_BUCKET = g => (g <= 6 ? g : g <= 9 ? 7 : g <= 14 ? 8 : 9);
  const GAP_LABEL = ['', '1', '2', '3', '4', '5', '6', '7–9', '10–14', '15+'];
  function customerModel(history, buyers, days, t0, sellerId) {
    const wd = weekdaysFrom(t0, days + 1);
    const byBuyer = {};
    buyers.forEach(b => { byBuyer[b.id] = []; });
    history.forEach(h => { if (byBuyer[h.buyerId]) byBuyer[h.buyerId].push(h); });
    // Global hazard by gap bucket and weekday, then per-buyer shrunk towards it.
    const gH = Array.from({ length: 10 }, () => ({ h: 0, n: 0 })), wH = Array.from({ length: 7 }, () => ({ h: 0, n: 0 }));
    const perBuyer = {};
    buyers.forEach(b => {
      const ds = new Set(byBuyer[b.id].map(h => h.day));
      const first = Math.min(...ds, days); let gap = null;
      const own = Array.from({ length: 10 }, () => ({ h: 0, n: 0 }));
      for (let d = first; d < days; d++) {
        if (gap != null) { const g = GAP_BUCKET(gap), hit = ds.has(d) ? 1 : 0; gH[g].h += hit; gH[g].n++; own[g].h += hit; own[g].n++; wH[wd[d]].h += hit; wH[wd[d]].n++; }
        gap = ds.has(d) ? 1 : gap == null ? null : gap + 1;
      }
      perBuyer[b.id] = { own, gap: gap == null ? null : gap, orders: byBuyer[b.id] };
    });
    const base = sum(gH.map(x => x.h)) / Math.max(1, sum(gH.map(x => x.n)));
    const gRate = gH.map(x => (x.h + base * 5) / (x.n + 5));
    const wRate = wH.map(x => (x.h + base * 5) / (x.n + 5) / base);
    const tomorrowWd = wd[days];
    const out = buyers.map(b => {
      const pb = perBuyer[b.id], orders = pb.orders;
      if (!orders.length) return null;
      const g = pb.gap == null ? 9 : GAP_BUCKET(pb.gap);
      const own = pb.own[g];
      const p = clamp(((own.h + gRate[g] * 8) / (own.n + 8)) * wRate[tomorrowWd], 0, 0.98);
      // Typical gap and what the buyer usually takes.
      const daysList = [...new Set(orders.map(h => h.day))].sort((a, c) => a - c);
      const gaps = daysList.slice(1).map((d, i) => d - daysList[i]);
      const typical = gaps.length ? median(gaps) : null;
      const last30 = orders.filter(h => h.day >= days - 30);
      const prodAgg = {};
      orders.forEach(h => h.items.forEach(it => { const a = prodAgg[it.productId] = prodAgg[it.productId] || { n: 0, qty: 0, mine: 0, spend: 0 }; a.n++; a.qty += it.qty; a.spend += it.status === 'out' ? 0 : it.qty * it.price; if (it.sellerId === sellerId) a.mine++; }));
      const basket = Object.entries(prodAgg).map(([productId, a]) => ({ productId, p: a.n / orders.length, qty: round1(a.qty / a.n), mineShare: a.mine / a.n })).sort((x, y) => y.p - x.p);
      const mineItems = orders.reduce((s, h) => s + h.items.filter(it => it.sellerId === sellerId).length, 0), allItems = orders.reduce((s, h) => s + h.items.length, 0);
      const spend30 = last30.reduce((s, h) => s + h.items.reduce((a, it) => a + (it.status === 'out' ? 0 : it.qty * it.price), 0), 0);
      const risk = typical != null && pb.gap != null ? clamp((pb.gap - typical - 1) / Math.max(3, typical * 2), 0, 1) : 0;
      return { id: b.id, name: b.name, type: b.type, typeLabel: BUYER_TYPES[b.type].label, pTomorrow: p, gap: pb.gap, typicalGap: typical, orders30: last30.length, orders: orders.length, spend30, loyalty: allItems ? mineItems / allItems : 0, risk, basket, lastDay: daysList[daysList.length - 1] };
    }).filter(Boolean);
    return { customers: out, gapRates: gRate.map((r, i) => ({ label: GAP_LABEL[i], rate: r, n: gH[i].n })), weekdayFactor: wRate, tomorrowWd, base };
  }

  // ---------- price intelligence ----------
  // How often the cheapest, second cheapest... stall won an item, from history + prices of the day.
  function priceWinShare(history, priceHistory, offers) {
    const byDay = {};
    priceHistory.forEach(p => { (byDay[p.day] = byDay[p.day] || {})[p.offerId] = p; });
    const buckets = [{ label: 'Хамгийн хямд', lo: -1, hi: 0.0001 }, { label: '0–5% дээр', lo: 0.0001, hi: 0.05 }, { label: '5–10% дээр', lo: 0.05, hi: 0.1 }, { label: '10%-с дээш', lo: 0.1, hi: 99 }];
    const stat = buckets.map(b => Object.assign({ won: 0, offered: 0 }, b));
    const byProd = {}; offers.forEach(o => { (byProd[o.productId] = byProd[o.productId] || []).push(o); });
    history.forEach(h => {
      const dp = byDay[h.day]; if (!dp) return;
      h.items.forEach(it => {
        const os = (byProd[it.productId] || []).filter(o => dp[o.id] && dp[o.id].stock);
        if (os.length < 2) return;
        const cheapest = Math.min(...os.map(o => dp[o.id].price));
        os.forEach(o => { const rel = (dp[o.id].price - cheapest) / cheapest; const b = stat.find(s => rel >= s.lo && rel < s.hi); if (!b) return; b.offered++; if (o.id === it.offerId) b.won++; });
      });
    });
    return stat.map(s => ({ label: s.label, share: s.offered ? s.won / s.offered : null, n: s.offered }));
  }
  function sellerReliability(history, sellers, days, window) {
    const from = days - (window || 30);
    return sellers.map(s => {
      let ordered = 0, out = 0, baitOrdered = 0, baitOut = 0, ratings = [];
      history.forEach(h => { if (h.day < from) return; if (h.rating && h.rating[s.id]) ratings.push(h.rating[s.id]); h.items.forEach(it => { if (it.sellerId !== s.id) return; ordered++; if (it.status === 'out') out++; }); });
      return { id: s.id, ordered, out, outRate: ordered ? out / ordered : 0, rating: ratings.length ? mean(ratings) : null, nRatings: ratings.length };
    });
  }
  // Bait pricing: a stall's sold-out rate when it was the cheapest vs otherwise, against a shuffled null.
  function baitTest(history, priceHistory, offers, sellers, seed) {
    const byDay = {}; priceHistory.forEach(p => { (byDay[p.day] = byDay[p.day] || {})[p.offerId] = p; });
    const byProd = {}; offers.forEach(o => { (byProd[o.productId] = byProd[o.productId] || []).push(o); });
    const rows = {}; sellers.forEach(s => { rows[s.id] = { cheapOut: 0, cheapN: 0, otherOut: 0, otherN: 0, flags: [] }; });
    history.forEach(h => { const dp = byDay[h.day]; if (!dp) return; h.items.forEach(it => {
      const os = byProd[it.productId] || []; if (os.length < 2 || !dp[it.offerId]) return;
      const cheapest = Math.min(...os.filter(o => dp[o.id]).map(o => dp[o.id].price));
      const r = rows[it.sellerId]; if (!r) return;
      const isCheap = dp[it.offerId].price <= cheapest, isOut = it.status === 'out' ? 1 : 0;
      if (isCheap) { r.cheapN++; r.cheapOut += isOut; } else { r.otherN++; r.otherOut += isOut; }
      r.flags.push({ cheap: isCheap, out: isOut });
    }); });
    const r = rng(seed || 11);
    return sellers.map(s => {
      const x = rows[s.id], cheapRate = x.cheapN ? x.cheapOut / x.cheapN : 0, otherRate = x.otherN ? x.otherOut / x.otherN : 0, diff = cheapRate - otherRate;
      let beat = 0; const reps = 200;
      if (x.cheapN >= 10 && x.otherN >= 10) for (let k = 0; k < reps; k++) {
        const f = x.flags.slice(); for (let i = f.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = f[i].out; f[i].out = f[j].out; f[j].out = t; }
        let co = 0, oo = 0; f.forEach(z => { if (z.cheap) co += z.out; else oo += z.out; });
        if (co / x.cheapN - oo / x.otherN >= diff) beat++;
      }
      const p = x.cheapN >= 10 && x.otherN >= 10 ? (beat + 1) / (reps + 1) : null;
      return { id: s.id, cheapRate, otherRate, cheapN: x.cheapN, otherN: x.otherN, p, flagged: p != null && p < 0.02 && diff > 0.08 };
    });
  }

  // ---------- buyer: the best way to fill a basket ----------
  // lines: [{productId, qty}]. Returns three plans: cheapest, most reliable, fewest stalls.
  function basketPlans(lines, offers, reliability, opts) {
    opts = opts || {};
    const rel = {}; reliability.forEach(x => { rel[x.id] = x; });
    const cands = pid => offers.filter(o => o.productId === pid && o.stock);
    const score = (o, lambda) => o.price * (1 + lambda * (rel[o.sellerId] ? rel[o.sellerId].outRate : 0.1));
    const plan = (lambda, consolidate) => {
      let pick = {};
      lines.forEach(l => { const cs = cands(l.productId); if (!cs.length) return; pick[l.productId] = cs.slice().sort((a, b) => score(a, lambda) - score(b, lambda))[0]; });
      if (consolidate) {
        // Move items to the stall that already holds the most value when it costs at most `consolidate` more.
        for (let pass = 0; pass < 3; pass++) {
          const val = {}; lines.forEach(l => { const o = pick[l.productId]; if (o) val[o.sellerId] = (val[o.sellerId] || 0) + o.price * l.qty; });
          const main = Object.entries(val).sort((a, b) => b[1] - a[1]).map(e => e[0]);
          lines.forEach(l => { const cur = pick[l.productId]; if (!cur) return; for (const sid of main.slice(0, 2)) { if (sid === cur.sellerId) break; const alt = cands(l.productId).find(o => o.sellerId === sid); if (alt && alt.price <= cur.price * (1 + consolidate)) { pick[l.productId] = alt; break; } } });
        }
      }
      let total = 0, riskNone = 1; const stalls = new Set(), missing = [];
      lines.forEach(l => { const o = pick[l.productId]; if (!o) { missing.push(l.productId); return; } total += o.price * l.qty; stalls.add(o.sellerId); riskNone *= 1 - (rel[o.sellerId] ? rel[o.sellerId].outRate : 0.1); });
      return { pick, total, stalls: [...stalls], risk: 1 - riskNone, missing };
    };
    return { cheap: plan(0, 0), reliable: plan(opts.lambda == null ? 6 : opts.lambda, 0), fast: plan(2, 0.08) };
  }

  // Stock plan for one seller: tomorrow's demand per product, week, what to buy.
  function stockPlan(history, days, t0, sellerId, offers, stockQty) {
    const wd = weekdaysFrom(t0, days);
    return offers.filter(o => o.sellerId === sellerId).map(o => {
      const y = dailySeries(history, days, it => it.offerId === o.id || (it.sellerId === sellerId && it.productId === o.productId));
      const yAll = dailySeries(history, days, it => it.productId === o.productId);
      const f = forecastSeries(y, wd), fa = forecastSeries(yAll, wd);
      const have = stockQty && stockQty[o.id] != null ? stockQty[o.id] : null;
      const need = f.hi, week = sum(f.week);
      const sd = Math.max(1e-9, (f.hi - f.lo) / 2.07), z = have == null ? null : (have - f.next) / sd;
      const outRisk = z == null ? null : (f.next <= 0 ? 0 : 1 - normCdf(z));
      return { offerId: o.id, productId: o.productId, next: f.next, lo: f.lo, hi: f.hi, week, marketNext: fa.next, marketWeek: sum(fa.week), skill: f.skill, have, buy: have == null ? null : Math.max(0, Math.ceil(need - have)), outRisk, sold30: sum(y.slice(-30)), sold7: sum(y.slice(-7)) };
    });
  }

  // Market-wide: product demand and price trend for the buyer's "when to buy" hints.
  function marketView(history, priceHistory, days, t0, products, offers) {
    const wd = weekdaysFrom(t0, days);
    return products.map(p => {
      const y = dailySeries(history, days, it => it.productId === p.id);
      const f = forecastSeries(y, wd);
      const os = offers.filter(o => o.productId === p.id).map(o => o.id);
      const daily = []; for (let d = 0; d < days; d++) { const ps = priceHistory.filter(x => x.day === d && os.includes(x.offerId) && x.stock).map(x => x.price); daily.push(ps.length ? Math.min(...ps) : null); }
      const recent = daily.slice(-7).filter(v => v != null), prev = daily.slice(-28, -7).filter(v => v != null);
      const trend = recent.length && prev.length ? mean(recent) / mean(prev) - 1 : 0;
      return { productId: p.id, demandNext: f.next, demandWeek: sum(f.week), skill: f.skill, minPriceNow: recent.length ? recent[recent.length - 1] : null, priceTrend: trend, series: daily };
    });
  }

  // ---------- evaluation: does any of this beat naive guessing? ----------
  function evaluate(data, offers, products, sellers) {
    const { history, priceHistory, days, t0, buyers } = data;
    const wd = weekdaysFrom(t0, days);
    // Demand: top products by volume, mixture MAE vs naive 7-day mean, and a shuffled-days null.
    const vol = products.map(p => ({ p, y: dailySeries(history, days, it => it.productId === p.id) })).sort((a, b) => sum(b.y) - sum(a.y)).slice(0, 8);
    const demand = vol.map(({ p, y }) => { const f = forecastSeries(y, wd); return { productId: p.id, mae: f.mae, naiveMae: f.naiveMae, skill: f.skill, next: f.next, scored: f.scored, weights: f.weights }; });
    const r = rng(5); let nullSkills = [];
    for (let k = 0; k < 15; k++) { const sk = vol.slice(0, 4).map(({ y }) => { const s = y.slice(); for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = s[i]; s[i] = s[j]; s[j] = t; } return forecastSeries(s, wd).skill; }); nullSkills.push(mean(sk)); }
    const demandSkill = mean(demand.slice(0, 4).map(d => d.skill));
    // Customers: predict day `days-1` from the days before it, on 10 holdout days.
    let hits = 0, tries = 0, topHits = 0, topN = 0;
    for (let hold = days - 10; hold < days; hold++) {
      const past = history.filter(h => h.day < hold);
      const cm = customerModel(past, buyers, hold, t0, null);
      const actual = new Set(history.filter(h => h.day === hold).map(h => h.buyerId));
      cm.customers.forEach(c => { tries++; if ((c.pTomorrow >= 0.5) === actual.has(c.id)) hits++; });
      cm.customers.slice().sort((a, b) => b.pTomorrow - a.pTomorrow).slice(0, 5).forEach(c => { topN++; if (actual.has(c.id)) topHits++; });
    }
    const baseRate = mean(Array.from({ length: 10 }, (_, i) => new Set(history.filter(h => h.day === days - 10 + i).map(h => h.buyerId)).size / buyers.length));
    return { demand, demandSkill, nullSkill: mean(nullSkills), nullMax: Math.max(...nullSkills), customerAcc: tries ? hits / tries : 0, customerTop5: topN ? topHits / topN : 0, baseRate, winShare: priceWinShare(history, priceHistory, offers), bait: baitTest(history, priceHistory, offers, sellers), reliability: sellerReliability(history, sellers, days, 30) };
  }

  return { synth, forecastSeries, dailySeries, weekdaysFrom, customerModel, priceWinShare, sellerReliability, baitTest, basketPlans, stockPlan, marketView, evaluate, BUYER_TYPES, SELLER_TRAITS, EXPERTS, WEEKDAYS, DAY, GAP_LABEL };
});
