# PSC 131 Perception — Illusory Conjuntions (Treisman & Schmidt, 1982)

A self-contained classroom adaptation inspired by Treisman & Schmidt (1982). Static HTML, CSS and JavaScript; no installation, build, or third-party libraries. Google Apps Script handles result collection separately. Works on GitHub Pages, including project subpaths.

## Publish on GitHub Pages

1. Create a GitHub repository (a public repository works with GitHub Free).
2. Upload **the contents of this folder** to the repository root: `index.html`, `style.css`, `app.js`, `logic.js`, `submission.js`, and `.nojekyll`. Keep the files together. The README and LICENSE may also be uploaded. Do not upload just the ZIP or put everything in an extra subfolder.
3. Open the repository's **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select your branch (usually `main`) and **/ (root)**, then Save.
4. Wait for GitHub's Pages deployment to finish. Open the URL shown in Settings → Pages, usually `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.
5. Test one session on that URL, then share it with students. No GitHub account is required to participate on a public Pages site.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

The entry page contains only the course title, demo title, required first name, last name and email fields, a short submission notice, and a Start demo button. Exposure is fixed at **200 ms** and each session has **32 scored trials** (16 per condition). URL parameters cannot change these settings.

## Preview locally

Serve this folder using any static web server, for example:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Do not double-click index.html: browser security generally blocks JavaScript module imports over `file://`.

## Classroom procedure

- Prefer laptops/desktops. Phones can be used in landscape, but physical stimulus size and viewing angle vary.
- Enter student details and select Start demo. Instructions appear before each trial; feedback is delayed until the session ends. There are no practice trials or student-adjustable settings.
- **Digits first:** attend primarily to the two flanking black digits, report them from left to right, then report any remembered colored letters.
- **Letters only:** ignore the digits and report remembered colored letters directly.
- The scored schedule contains equal numbers of both conditions, randomly interleaved. No seed is required; the generated stimuli are exported.
- Each display has three distinct letters chosen from H, K, O, R, T, X and three distinct colors chosen from red, blue, green, purple. Flanking digits are distinct and drawn from 1–9. Letter/color and left/right digit report order are documented in the export.
- Fixation is 650 ms, stimulus is 200 ms, and the pattern mask is 200 ms. Responses are untimed. Each trial starts with a participant action; there is no continuous flashing animation.
- Encourage students to use unsure/blank rather than forced guesses. Each letter and color may be reported at most once per trial. This constraint is a simplification of free recall.
- Download results before reloading or closing the page. End session produces results for completed scored trials only; an unfinished current trial is discarded.

## Results and CSV

There are three report rows per completed trial. Letter and color are reported as a pair, in any order; report slots are **not spatial locations**.

- `correct`: the reported letter–color pair was shown.
- `recombined`: both features were shown, but the pair was not.
- `feature_error`: a complete pair contains at least one feature absent from the display.
- `partial`: only a letter or only a color was reported (regardless of whether that feature was present).
- `blank`: neither feature was reported.

The displayed recombination rate is recombined / all complete pairs, including feature errors. Partial and blank slots are excluded. Digit accuracy counts individual digits in their correct left/right positions; blanks count as incorrect. Starting a new session clears the prior trial records.

CSV has one row per report slot (three per completed scored trial). It includes a random session ID, student first name, last name and email, trial order, condition (`divided` = digits first, `focused` = letters only), practice flag (always false), requested exposure, frame-estimated exposure, interrupted-attempt count for that trial, actual displayed features, digit responses, letter/color responses, and category. All cells are quoted. The app collects first name, last name and email in the browser and includes them in every exported trial row. No student details are placed in URLs or filenames. CSV cells beginning with formula characters are prefixed with an apostrophe for spreadsheet safety. GitHub itself may maintain standard hosting access logs.

Student details and completed-trial responses are submitted to the configured Google Apps Script endpoint after all 32 trials. Early-ended sessions require selecting Submit completed trials. The browser holds a local copy in memory, not browser storage; reloading clears that local copy. Submitted data remains in the instructor’s Google Sheet. The CSV also contains identifiable student information. Selecting New session clears the entry form for the next student.

## Google Sheet connection

The deployment URL is configured in `submission.js`. Keep your Sheet private; students submit through Apps Script and do not need spreadsheet access. The entry form explains the submission before the student starts.

The updated public endpoint was checked without authentication. A clearly labeled synthetic **Connection Test** submission returned `Saved`. That test may appear as a row with email `connection-test@example.invalid`; it contains one blank-response trial and should be excluded from class results. The earlier UC Davis SSO redirect is no longer present. Browser-origin submission from the final GitHub Pages site still needs its normal classroom acceptance test.

If deployment produces a different URL ending in `/exec`, replace `RESULTS_ENDPOINT` in `submission.js` with it, then upload the updated file to GitHub Pages. Do not use the `/dev` test URL. Do not place student information or credentials in the endpoint URL.

The receiver must be the Apps Script `doPost(e)` from the setup instructions: parse `e.postData.contents` as JSON, accept `{session, student: {firstName, lastName, email}, records}`, write to your private Sheet, deduplicate using the session ID, and return `ContentService.createTextOutput('Saved')` only after a successful write. It stores one row per session with full trial JSON in the final column. Session IDs are reused for retries.

The browser sends a JSON body with `Content-Type: text/plain;charset=UTF-8` and follows Google's response redirect. Only a readable successful response containing exactly `Saved` is shown as confirmed. No opaque `no-cors` response is treated as proof of storage. A 25-second timeout, failed request, sign-in page, or unexpected response produces an **unconfirmed** status and offers retry plus CSV backup. The first write might have succeeded even if its response was lost; receiver deduplication prevents another row on retry. Students can download CSVs during submission; new sessions are disabled while sending.

After updating deployment access, test from the actual GitHub Pages URL in a signed-out browser. Complete a trial, end the session early, and select Submit completed trials. Check both the confirmation message and a new row in the private Sheet. Then test a full 32-trial session's automatic submission. The public receiver can accept forged submissions; entered names and emails are not verified identities.

Official Apps Script documentation: https://developers.google.com/apps-script/guides/web and https://developers.google.com/apps-script/guides/content

## Scientific and timing limits

This is a **teaching adaptation, not an exact replication or a validated research instrument**. A recombined response is consistent with an illusory conjunction, but does not prove a perceptual origin: guessing, memory, and response errors can produce the same category. No particular error rate or condition difference is guaranteed. The letters-only condition changes reporting demands and retention time, so its difference from digits-first does not isolate attention alone. There are no inferential tests or chance corrections.

Exposure scheduling uses `requestAnimationFrame`; the CSV estimates onset-to-mask duration from frame callback timestamps. It is quantized to refresh cycles and is not a photodiode measurement of physical presentation. Mask and geometry are simplified; color calibration, viewing distance and visual angle are uncontrolled. Hidden tabs, window blur, and resize during fixation/stimulus/mask interrupt the attempt; the current trial restarts with fresh stimuli. Interrupted attempts are counted, not scored. The app cannot detect every source of timing disruption. A color-vision difference can affect performance; offer observation/discussion as an alternative.

## Sources

Treisman, A., & Schmidt, H. (1982). Illusory conjunctions in the perception of objects. *Cognitive Psychology, 14*(1), 107–141. https://doi.org/10.1016/0010-0285(82)90006-8

Treisman, A. (2007). How the deployment of attention determines what we see. https://pmc.ncbi.nlm.nih.gov/articles/PMC1832144/

The implementation is original; no figures or text from the original experiment are reproduced. Source code is available under the included MIT license.
