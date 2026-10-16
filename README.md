# A2 Key · Responsive English learning app

A separate installable copy of the completed 30-day English course. The original course files are preserved. All 330 real MP3s and exact downloadable transcripts are included, as are the latest per-word Chinese reveal buttons.

最新功能与验证记录：[更新日志](CHANGELOG.md)。发布后的首页页脚也可打开 [网页更新日志](https://wayne-shen.github.io/a2-key-english/changelog.html)。

## Install and use offline

Open [A2 Key](https://wayne-shen.github.io/a2-key-english/) online in your browser. The app responds to phone, tablet and computer screen sizes. The older private ChatGPT Site remains a separate deployment.

1. Open **Offline & downloads** from the dashboard.
2. Optionally install the app using your browser’s **Install app** or **Add to Home Screen** option. Installation controls vary by browser.
3. In the browser or installed app you intend to use, choose **Download all courses**. Keep it open until it shows **30 / 30 days ready offline**. Audio and transcripts total approximately **211 MB**, plus lesson text and application files.
4. Disconnect from the network and check a lesson and its audio. Saved lesson text, questions, translations, vocabulary practice and recordings work offline; external news source links require a connection.

Offline setup needs one initial HTTPS visit. Installed apps and browser windows can have separate storage, so download in the one you will use. Interrupted downloads resume and skip saved files. You can also download a single day.

The download screen checks saved assets rather than relying on a completion flag. Downloads are verified for length and SHA-256 before saving. Your browser or device can reclaim local storage; clearing website data removes downloads and local progress. The app requests persistent storage where supported. Keep the hosted address for re-downloads.

## Files and rebuild

- `dist/`: complete static website, ready for HTTPS hosting at a root or subdirectory.
- `dist/manifest.webmanifest`: standalone display, relative installation scope and PNG icons.
- `dist/sw.js`: complete lesson text cache and local MP3 byte-range playback for offline seeking.
- `dist/offline.js`: resumable, verified per-day/all-day audio and transcript downloads.
- `scripts/build.py`: copies only learner-facing course files, generates icons and an asset inventory. It excludes credentials, provider metadata and production logs.

Rebuild from this checkout with `python3 scripts/build.py`. Check with `node scripts/test-pwa.cjs` and `node scripts/test-downloads.cjs`. Changes to copied course files must be made in the original course generator and then recopied. PWA-specific changes belong in this copy.

The published PWA has its own device/browser progress. Existing progress in the original local-file course is not automatically transferred.

若普通窗口仍显示旧版而隐私窗口正常，请在普通窗口打开 [检查课程更新](https://wayne-shen.github.io/a2-key-english/update.html)，保持联网直到显示“课程已更新就绪”，再点击“打开新版课程”。无需清除网站数据。以后每次构建会自动更新 Service Worker 的版本号；新版就绪时显示“刷新使用新版”，手动刷新后开始使用，避免打断正在填写的练习。

## 我的生词本

选择题点击选项后会立即自动核对答案；改选后即时更新反馈，选择题不再显示 **Check answer** 按钮。填空题继续使用按钮核对。答案和解析保持默认隐藏。

选择题按显示位置连续编号为 A、B、C（配对题为 A–H），与正确答案位置保持一致。运行 `node scripts/test-choice-labels.cjs` 可检查全部 30 天的选项字母、自动判题及原有课程交互，包括曾经错位的 Day 5 Listening Part 4 第 2 题。

在全部 30 天课程的 New vocabulary 和 Review words 词卡上，点击 **☆ 标记不熟练** 即可保存单词；再次点击即可取消。首页和每课的 **我的生词本** 显示待复习数量，进入后可搜索英文或中文、按主学习日筛选、查看英文解释和例句，再展开中文。点击 **学会了，取消标记** 可将词条移除；**回到课程** 会打开该词对应的主学习词卡。

同一个词在不同日期共用标记，保存在当前浏览器的 `a2-unfamiliar-words-v1` 中，与原有课程完成记录独立。刷新和离线使用会保留标记；不同设备/网站之间不会自动同步，清除网站数据会删除记录。存储读取或写入失败时会显示提示，不假装保存成功。

`dist/word-review.html`、`word-review.js` 和 `word-review.css` 是 PWA 专用文件。构建脚本自动给复制的课程添加入口与标记控件，并从已验证课程生成 `word-catalog.js`，保留 1,796 个词条的原始例句及主学习日。它们都进入离线缓存；源课程文本、题目与音频保持原样。

浏览器回归：为 `dist/` 启动本地服务器（默认 `http://127.0.0.1:8765/`），在可用 Playwright 的 Node 环境运行 `node scripts/test-word-review.cjs`。可通过 `COURSE_TEST_URL` 指定地址，通过 `COURSE_BROWSER_PATH` 指定 Chrome 可执行文件。检查全部 30 课的标记按钮、刷新保存、跨页去重、跨标签页同步、取消标记、搜索筛选、原词卡跳转、存储失败、真实断网复习与平板/手机宽度。已通过 Chrome；本机未安装 WebKit，Safari/iPad 实机检查仍待完成。

Validation: all 30 copied decks passed the original course regression harness (2,430 objective questions). PWA tests verify hashes and references, offline lesson navigation, MP3 range requests, failed install/authentication responses, download integrity, resume and accurate readiness counts. Physical iPad installation and playback require checking on your device.

## GitHub repository and Pages

Public repository: https://github.com/Wayne-Shen/a2-key-english

GitHub Pages: https://wayne-shen.github.io/a2-key-english/

Status (2026-10-15): the repository is public at the owner's request. GitHub Pages is enabled with HTTPS, publishing the root of `gh-pages`.

The complete learner-facing website is in `dist/`. The `gh-pages` branch contains only those files at its root, including all 30 lessons, 330 MP3s, transcripts, and offline support. Credentials and course production files are outside this checkout. `.nojekyll` keeps GitHub Pages from processing the static files with Jekyll.

After committing updates, validate and publish from this checkout:

```sh
node scripts/test-pwa.cjs
node scripts/test-downloads.cjs
git push origin main
git subtree push --prefix=dist origin gh-pages
```

Repository **Settings → Pages** is configured with **Deploy from a branch**, `gh-pages`, and `/ (root)`. Pushing `main` saves source and documentation changes; pushing `gh-pages` deploys the updated website. Both the repository and published lessons are public. Hosting from a private repository would require an eligible paid GitHub plan.

The existing private ChatGPT Site is a separate deployment and retains its own address and access settings.

## Learning dashboard and word studio · 2026-10-16

`dist/index.html` is now the main responsive learning dashboard. It reads existing `a2-day-completed` records, recommends the next unfinished day, links to all 30 complete lessons, and provides the word studio and offline downloads. It does not change lesson completion automatically. `studio.css`, `studio.js` and `course-data.js` implement the interface; the build regenerates course titles from the validated lessons.

Vocabulary focus rounds use the existing 1,796-entry catalog: meaning and example, optional Chinese reveal, recall check, retry hints, and a speaking prompt. Successive rounds continue through the selected day or collection; six-word rounds supplement the complete locked vocabulary schedule. **Save for later** adds the word to the same `a2-unfamiliar-words-v1` collection used by lessons. Recalling a word does not remove its existing mark. The searchable collection retains day filters, explicit removal, and links to each original lesson word. Storage failures are reported without claiming a failed mark was saved.

Round position and coverage are saved in `a2-studio-session-v1`. Valid prototype round records and saved-for-later words are imported once, preserving existing word timestamps. The old `/prototype/` address forwards to the new app. The interface uses static HTML/CSS/JavaScript inspired by Intelligent UI; it does not embed ChatGPT’s native UI runtime or require an AI service.

Existing lesson-progress keys and the media/metadata cache names are retained, including their legacy `a2-ipad-*` prefixes. The service worker updates the app shell without deleting downloaded audio. Lessons, transcripts and audio content are unchanged. The course return link now points to “课程首页与离线下载”.

Preview locally with `python3 -m http.server 8766 --bind 127.0.0.1 --directory dist`, then open `http://127.0.0.1:8766/`. `node scripts/test-studio.cjs` checks dashboard, vocabulary, storage recovery, responsive layouts and offline use with Playwright. `node scripts/test-app-upgrade.cjs` installs the previous committed version on a temporary local origin, then verifies an upgrade retains completion, word marks, per-word practice and a downloaded day, without fetching audio again. Existing PWA, download, update, lesson-grading and word-review regressions also pass. Browser checks use Chrome; physical-device and Safari checks remain outstanding.

This release uses the existing GitHub Pages address and installation scope. Progress keys and media cache names remain unchanged; users can refresh to update without clearing website data or downloading saved recordings again.

## Focused daily lessons · 2026-10-16

All 30 day pages now share the dashboard’s neutral green palette, local system fonts and simple wordmark. `scripts/lesson-template.html` generates a quiet lesson header and a single practice sheet; `dist/lesson.css` provides responsive reading and question columns that stack on narrow screens. Desktop widths of 1000px and above use a fixed-height viewport with anchored practice and navigation. Long material and expanded answers scroll inside focusable content regions with hidden scrollbars; wheel scrolling is contained within the region. Smaller screens keep natural document scrolling. Content and audio controls remain reachable without being covered by navigation.

The main view has a section selector, section-relative progress and Previous/Next. Completion, goals, course switching, word-collection links, downloads and parent notes remain under **Lesson tools**. Answer and explanation buttons remain available under **Answer help**. News citations and downloads remain under **Source & downloads**. Vocabulary marking appears alongside the word instead of above the speaking task. These disclosures preserve the original controls and handlers.

`dist/lesson.js` is a presentation layer attached through the build; original lesson data, questions, answer keys, audio URLs and storage keys are retained. Rebuild with `python3 scripts/build.py`; do not edit generated lesson pages individually. Check with `node scripts/test-lessons.cjs` (Playwright and a local server required), plus the existing question, auto-feedback, collection, PWA, update and download checks. Lesson layouts were checked in Chrome at 320, 390, 768, 1024 and 1440 pixels, including offline access. Safari and physical-device checks remain outstanding.

## English interface and automatic choice checks · 2026-10-16

All learner-facing pages, tools, instructions, grammar explanations, answer feedback, parent notes, update notices and download messages are English. Chinese remains only in vocabulary meanings, including the news glossary and optional translation reveals. The build uses `scripts/english_lesson.py` for English presentation text while retaining the embedded original course data, question content, answer keys and audio. Existing English explanations are reused; Chinese-only grammar and parent guidance have explicit English versions. Missing translations fail the build.

Choice questions retain their automatic checker closure and no longer show a manual Check answer button. The focused lesson renderer removes that button from active choice cards; inactive choice cards keep it hidden. Typed questions retain their manual button. Keyboard grading, answer help, retries, original progress and offline downloads are preserved.

`node scripts/test-english-ui.cjs` audits all 30 lesson DOMs, including hidden lesson content, tools, explanations and notes, and the dashboard, studio, collection, downloads, update page and changelog. It allows Chinese text only in vocabulary-definition elements and verifies 2,100 automatically checked choice questions and 330 manually checked typed questions.

### Desktop paging stability

The lesson renderer captures reading position before hiding the old slide. When the next question uses the same passage, it restores that position; new material starts at the top. Desktop paging does not call page-level scroll commands. `node scripts/test-desktop-stability.cjs` checks all 30 days, stable sheet/button coordinates, arrow-key navigation, unchanged answer selections, reachability of long content, 22px Chinese meanings and the mobile fallback. Tested desktop viewports: 1440×900, 1194×834, 1024×768 and 1280×600.

## Sequential lesson unlocking · 2026-10-16

Day 1 starts unlocked. Use **Lesson tools → Mark day complete** to save a day’s completion and unlock the next day. This uses the existing `a2-day-completed` record; no records are cleared or renumbered. New unfinished lessons require every preceding day to be complete. Previously completed days remain available for review, even if older records contain gaps. Unmarking a prerequisite locks later unfinished days again.

`course-access.js` provides the shared rule for the dashboard, lesson menu, direct lesson addresses, word-studio day picker, saved practice sessions and collection. Locked lesson pages show an English message and a link to the next available day; they do not execute the lesson application. Progress changes update other tabs and are checked again when a page is restored. The same policy works offline. All course downloads remain available in advance, independently of learning access. Marked words from locked days are retained and reappear once their lesson unlocks.

Lesson HTML now has a `lesson-entry` descriptor instead of a directly executed app script. The access layer loads it after the shared scripts are ready, only for an available lesson. `node scripts/test-unlock.cjs` checks all 30 unlock steps, menu and dashboard states, direct URLs, stale vocabulary sessions, cross-tab revocation, offline unlocking, existing completed-day review and invalid-storage preservation. Whole-course browser regression fixtures explicitly mark all days complete before auditing every lesson.

## Audio controls and release verification · 2026-10-16

Audio sits beside the title on desktop and below it on narrow screens, without a recording hint. One persistent native player stays mounted outside hidden question slides, avoiding controls rebuilding during Previous/Next navigation. Questions sharing a recording keep playback and position; changing recordings pauses playback. `node scripts/test-lesson-player.cjs` checks playback continuity, absence of player remounts or source reloads, and alignment at six responsive sizes.

`node scripts/test-app-upgrade.cjs` uses the previous public release, `14686e1`, as a reproducible upgrade baseline. Set `COURSE_PREVIOUS_REF` to test another Git revision. It verifies completion, word marks, per-word practice, saved downloads, offline seeking and lessons after upgrading the same origin. All 660 downloadable audio/transcript assets keep their previous URLs, sizes and hashes.
