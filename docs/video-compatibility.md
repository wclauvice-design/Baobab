# Product video playback — 28 October 2026

## Findings

The former CacheFirst image route matched every public Supabase Storage URL, including MP4s. Safari video range requests could therefore be handled as images. The source storage was checked with `Range: bytes=0-1023` and returned HTTP 206, `Content-Type: video/mp4`, and a correct Content-Range.

All 18 public catalog videos were inspected with ffprobe: H.264 High, yuv420p, AAC-LC, level 3.1 (one 3.2), maximum 1280x720 or 720x960. No incompatible codec was found in this catalog snapshot. This does not certify future uploads.

All seven video placements previously relied on autoplay without posters, controls, or error UI. Gallery thumbnails also played videos independently.

## Changes

- Shared ProductVideo component for cards, details, vehicle cards and seller suggestions.
- Real product-photo poster (or neutral placeholder), manual start and native controls on details, retry UI for loading/decoding failure.
- Muted inline playback, handled play() rejection, visibility-based loading and pause; reduced-motion/data-saving preferences respected for autoplay.
- Only the active gallery slide loads its video; thumbnails are static photos with a video indicator.
- NetworkOnly video/audio/range routing before image caching. Public storage objects are no longer indiscriminately cached as images.
- Non-cacheable worker/registration HTTP headers to help installed PWAs pick up the correction.

## Validation

- Production PWA build and six tests against the generated service-worker routes.
- Browser checks at desktop and 390px: eight blocked-autoplay assertions pass; user-initiated video decodes and plays; missing source displays fallback; only the active gallery video has a source; no horizontal overflow.
- Physical iPhone/Safari validation remains necessary. Chromium at a mobile viewport is not an iPhone test.
- A successful browser fallback does not transcode unsupported future files. Prefer H.264/yuv420p + AAC in MP4 with faststart; MOV/WebM filenames alone do not establish codec compatibility.
