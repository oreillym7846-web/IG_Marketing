const CACHE='ck-story-v12';
const ASSETS=['./','index.html','styles.css','styles-v5.css','styles-v6.css','styles-v8.css','styles-v9.css','styles-v10.css','styles-v11.css','app.js?v=12','manifest.webmanifest','assets/canonical-master.jpg','assets/template-2-photo-draft.png','assets/template-1-photo-landscape-draft.png','assets/template-1-photo-vertical-draft.png','assets/apple-touch-icon.png','examples/avion/photo-1.jpg','examples/avion/photo-2.jpg','examples/avion/photo-3.jpg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request))));
