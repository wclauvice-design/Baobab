const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Exercise the emitted worker, not a second copy of the routing expressions.
const routes = [];
class NetworkOnly {}
class CacheFirst {}
class StaleWhileRevalidate {}
const noop = () => {};
const workbox = {
  clientsClaim: noop, precacheAndRoute: noop, cleanupOutdatedCaches: noop,
  createHandlerBoundToURL: noop, NavigationRoute: class {},
  NetworkOnly, CacheFirst, StaleWhileRevalidate,
  ExpirationPlugin: class {}, CacheableResponsePlugin: class {},
  registerRoute: (match, handler) => { if (typeof match === 'function') routes.push({ match, handler }); },
};
vm.runInNewContext(readFileSync(path.join(__dirname, '../dist/sw.js'), 'utf8'), {
  self: { define: true, skipWaiting: noop },
  define: (_deps, factory) => factory(workbox),
});
function handler(path, destination = '', range = false) {
  return routes.find(({ match }) => match({
    url: new URL(path, 'https://storage.example'),
    request: { destination, headers: new Headers(range ? { Range: 'bytes=0-1023' } : {}) },
  }))?.handler;
}
test('Supabase MP4 bypasses the old image cache', () => {
  assert.ok(handler('/storage/v1/object/public/product-images/p/video.mp4') instanceof NetworkOnly);
});
test('all range requests preserve origin partial responses', () => {
  assert.ok(handler('/signed-object?token=x', '', true) instanceof NetworkOnly);
});
test('extensionless video and audio bypass caching', () => {
  assert.ok(handler('/asset', 'video') instanceof NetworkOnly);
  assert.ok(handler('/asset', 'audio') instanceof NetworkOnly);
});
test('MOV and WebM with signed queries bypass caching', () => {
  for (const ext of ['MOV', 'webm', 'm4v', 'ogv']) assert.ok(handler(`/v.${ext}?token=x`) instanceof NetworkOnly);
});
test('product photos still work offline', () => {
  assert.ok(handler('/storage/v1/object/public/product-images/p/photo.jpg', 'image') instanceof CacheFirst);
});
test('untyped storage URLs are not assumed to be images', () => {
  assert.equal(handler('/storage/v1/object/public/product-images/p/unknown'), undefined);
});
