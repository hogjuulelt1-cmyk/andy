// Runs training and forecasting off the main thread so the page stays responsive.
importScripts('engine.js?v=10');
self.onmessage = e => {
  const { id, type, spins, opts, cfg } = e.data;
  try {
    if (type === 'next') {
      const res = PL.walkForward(spins, cfg, { next: true, scoreFrom: Math.max(0, spins.length - 200) });
      self.postMessage({ id, result: { next: res.next, recent: { scored: res.scored, bitsPerSpin: res.bitsPerSpin, top1: res.top1, top3: res.top3 }, models: res.models } });
      return;
    }
    const res = PL.train(spins, Object.assign({}, opts, { onProgress: stage => self.postMessage({ id, progress: stage }) }));
    self.postMessage({ id, result: res });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
