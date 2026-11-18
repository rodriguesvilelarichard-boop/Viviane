/* Faz o app abrir sem internet. Ao mudar o app, troque o número da versão abaixo. */
var CACHE = 'custo-cozinha-v6';
var ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function comTempo(p, ms) {
  return new Promise(function (ok, erro) {
    var t = setTimeout(function () { erro(new Error('demorou')); }, ms);
    p.then(function (r) { clearTimeout(t); ok(r); }, function (x) { clearTimeout(t); erro(x); });
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // WhatsApp etc.
  if (req.mode === 'navigate') {
    // Com internet: pega a versão mais nova (até 4 s). Sem internet: usa a guardada.
    e.respondWith(comTempo(fetch(req), 4000).then(function (r) {
      if (r && r.ok) { var copia = r.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', copia); }); }
      return r;
    }).catch(function () {
      return caches.match('./index.html').then(function (r) { return r || fetch(req); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (r) {
    return r || fetch(req).then(function (res) {
      if (res && res.ok) { var copia = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copia); }); }
      return res;
    });
  }));
});
