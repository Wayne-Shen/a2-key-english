# A2 Key · iPad PWA copy

A separate installable copy of the completed 30-day English course. The original course files are preserved. All 330 real MP3s and exact downloadable transcripts are included, as are the latest per-word Chinese reveal buttons.

最新功能与验证记录：[更新日志](CHANGELOG.md)。发布后的首页页脚也可打开 [网页更新日志](https://wayne-shen.github.io/a2-key-english/changelog.html)。

## Install and use offline

Open [A2 Key on your iPad](https://wayne-shen.github.io/a2-key-english/) in **Safari** while online. The older private ChatGPT Site remains a separate deployment.

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

## 我的生词本

选择题点击选项后会立即自动核对答案；改选后即时更新反馈，仍保留 **Check answer** 按钮。填空题继续使用按钮核对。答案和解析保持默认隐藏。

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
