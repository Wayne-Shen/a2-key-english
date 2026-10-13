# A2 Key · iPad PWA copy

A separate installable copy of the completed 30-day English course. The original course files are preserved. All 330 real MP3s and exact downloadable transcripts are included, as are the latest per-word Chinese reveal buttons.

## Install and use offline

Open [A2 Key on your iPad](https://a2-key-ipad-course-wayne.wayneshen.chatgpt.site) in **Safari** while online. Sign in with the account that owns the private Site if prompted.

1. Tap **Share → Add to Home Screen**. Keep **Open as Web App** enabled if shown, then tap **Add**.
2. Open **A2 Key** from the Home Screen.
3. Tap **Download all courses** and keep the app open until it shows **30 / 30 days ready offline**. Audio and transcripts total approximately **211 MB**, plus lesson text and application files.
4. Turn on Airplane Mode and check a lesson and its audio. The saved text, questions, translations and recordings work offline; news source links require a connection.

A PWA cannot be installed on iPad directly from a ZIP, USB folder or file:// address. One initial HTTPS visit is required. Perform the download inside the installed app, since Safari and installed web apps can have separate storage. Interrupted downloads resume and skip saved files. You may download one day's audio instead of all 30.

The dashboard checks saved assets rather than relying on a completion flag. Downloads are checked for length and SHA-256 before saving. Safari can reclaim local storage, and clearing website data removes downloads and local progress. The app requests persistent storage where supported; it cannot guarantee that iPadOS will retain it forever. Keep the hosted address for re-downloads.

Installation instructions: [Apple iPad User Guide](https://support.apple.com/guide/ipad/bookmark-favorite-webpages-ipadc602b75b/ipados). Offline support uses the [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).

## Files and rebuild

- `dist/`: complete static website, ready for HTTPS hosting at a root or subdirectory.
- `dist/manifest.webmanifest`: standalone display, relative installation scope and PNG icons.
- `dist/sw.js`: complete lesson text cache and local MP3 byte-range playback for offline seeking.
- `dist/offline.js`: resumable, verified per-day/all-day audio and transcript downloads.
- `scripts/build.py`: copies only learner-facing course files, generates icons and an asset inventory. It excludes credentials, provider metadata and production logs.

Rebuild from this checkout with `python3 scripts/build.py`. Check with `node scripts/test-pwa.cjs` and `node scripts/test-downloads.cjs`. Changes to copied course files must be made in the original course generator and then recopied. PWA-specific changes belong in this copy.

The published PWA has its own device/browser progress. Existing progress in the original local-file course is not automatically transferred.

Validation: all 30 copied decks passed the original course regression harness (2,430 objective questions). PWA tests verify hashes and references, offline lesson navigation, MP3 range requests, failed install/authentication responses, download integrity, resume and accurate readiness counts. Physical iPad installation and playback require checking on your device.
