# Video regression checks

Build the PWA, then test the emitted service worker:

```sh
npm run build -w apps/pwa
node --test apps/pwa/tests/service-worker-media.test.cjs
```

With the PWA dev server running, open `/tests/video.html`.
The test page deliberately rejects autoplay until **Allow playback** is clicked.

1. At desktop width and 390 px, **Check blocked autoplay** must report eight true checks.
2. **Allow playback**, then **Lire la vidéo**: actual video frames and native controls must appear.
3. **Simulate missing video**: a product photo, an explicit error and Retry must remain available.
4. **Toggle gallery**, then select video 3: video 1 must have no src and be paused; thumbnails must contain no video elements.
5. Scroll players outside the viewport or switch tabs: playback pauses. Return to the page: eligible visible players can resume.
6. Repeat on physical Safari/iPhone with low-power mode, reduced motion, and Android data-saving mode. Desktop viewport emulation does not validate these OS policies.

`sample.mp4` is a synthetic 2-second H.264/yuv420p test pattern generated using FFmpeg, with faststart. No customer media is included. This HTML is not an entry point in the production build.
