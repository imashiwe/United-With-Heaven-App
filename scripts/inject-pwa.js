// Runs after expo export to inject PWA meta tags and write manifest.json + sw.js
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

const iconFile = fs.readdirSync(distDir)
  .find((f) => f.startsWith('icon.') && f.endsWith('.png')) || 'icon.png';

const pwaTags = [
  `<link rel="manifest" href="/manifest.json" />`,
  `<meta name="mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-capable" content="yes" />`,
  `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`,
  `<meta name="apple-mobile-web-app-title" content="United With Heaven" />`,
  `<link rel="apple-touch-icon" href="/${iconFile}" />`,
  `<script>if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}</script>`,
].join('\n');

let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', pwaTags + '\n</head>');
  fs.writeFileSync(indexPath, html);
}
console.log('PWA tags injected');

const manifest = {
  name: "United With Heaven",
  short_name: "UWH",
  description: "A prophetic ministry app for worship, written revelation, and anointed teaching.",
  start_url: "/",
  id: "/",
  display: "standalone",
  background_color: "#FAF6F0",
  theme_color: "#B8722A",
  orientation: "portrait",
  scope: "/",
  icons: [
    { src: `/${iconFile}`, sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: `/${iconFile}`, sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('manifest.json written');

const sw = `const CACHE_NAME="uwh-app-v1";const STATIC_ASSETS=["/","/manifest.json","/favicon.ico"];self.addEventListener("install",(e)=>{e.waitUntil(caches.open(CACHE_NAME).then((c)=>c.addAll(STATIC_ASSETS)));self.skipWaiting();});self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((k)=>k!==CACHE_NAME).map((k)=>caches.delete(k)))));self.clients.claim();});self.addEventListener("fetch",(e)=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;if(e.request.headers.get("accept")?.includes("text/html")){e.respondWith(fetch(e.request).then((r)=>{const c=r.clone();caches.open(CACHE_NAME).then((cache)=>cache.put(e.request,c));return r;}).catch(()=>caches.match("/")));return;}e.respondWith(caches.match(e.request).then((cached)=>cached||fetch(e.request).then((r)=>{if(r.ok){const c=r.clone();caches.open(CACHE_NAME).then((cache)=>cache.put(e.request,c));}return r;})));});`;
fs.writeFileSync(path.join(distDir, 'sw.js'), sw);
console.log('sw.js written');
