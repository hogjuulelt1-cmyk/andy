// Runs training off the main thread so the page stays responsive.
importScripts('engine.js');
self.onmessage = e => {
  const { id, spins, opts } = e.data;
  try {
    const res = PL.train(spins, Object.assign({}, opts, { onProgress: stage => self.postMessage({ id, progress: stage }) }));
    self.postMessage({ id, result: res });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
