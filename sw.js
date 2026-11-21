// 画面のファイルをスマホに保存しておき、開いた瞬間に出す（新しいものは裏で取ってきて次回から使う）。
// データ（サーバーへの POST）はここを通さない。版の確認（?nc=）と、新しい版への切り替え（ページの ?v=）は通信を優先する
const CACHE = 'shell-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const font = /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !font) return;
  if (url.searchParams.has('nc')) return;
  const versioned = !font && url.searchParams.has('v') && /\.js$/.test(url.pathname); // nav.js?v=… は版ごとに中身が決まっている
  const key = font || versioned ? req.url : url.origin + url.pathname;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(key);
    const net = fetch(req).then(async res => {
      if (res.ok) {
        if (versioned) for (const k of await cache.keys()) { const u = new URL(k.url); if (u.pathname === url.pathname && k.url !== key) cache.delete(k); } // 古い版は消す
        await cache.put(key, res.clone());
      }
      return res;
    });
    if (req.mode === 'navigate' && url.searchParams.has('v')) { // 新しい版に切り替えるとき
      try { return await net; } catch (err) { if (hit) return hit; throw err; }
    }
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  })());
});
