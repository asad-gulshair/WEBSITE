# Test report (2026-10-12, second pass)

Environment: Playwright + Chromium 140 (software WebGL via SwiftShader), local static server, Lighthouse 12.2, axe-core 4.10.

## Robot guide (42 automated checks, all passed)
Welcome line; canvas renders; Enter opens the panel; focus moves to the first option; `aria-expanded`; 6 options; for each interest the case-study links point to real projects and the "Discuss this" link pre-selects a valid form topic; × closes and returns focus; reopen; Esc; outside click; "See how a CV is scored" and "Just browsing" scroll to the right sections; docks after the hero at 1440 px and stays inside the left gutter; hides over the scoring section; a case-study link opens the right case study; topic pre-fill on the contact page; closing the bubble mutes it for the session; phone (390 px): launcher appears, sits clear of the quick-contact bar, panel fits the screen, answers work; reduced motion: no intro, still robot, panel works; no WebGL: drawn face, panel works; no page errors.

## Enquiry form (6 checks with the delivery service mocked, all passed)
Empty submit shows three errors and sends nothing; bad email rejected; success is shown only when the service confirms; payload carries name, email, message, reply method, phone and subject; a not-yet-activated service shows an error and the email fallback (no fake success); a network failure shows the same fallback.

## Accessibility
axe-core (WCAG 2 A/AA + best practice): no violations on all 5 pages at 1366 and 390 px, including the open guide panel.
Fixed in this pass: focusable button inside `aria-hidden` (hero), low-contrast labels (grey raised to #8A9096), button names that did not match visible text (recruiter screens), heading order on the contact form.

## Lighthouse (after fixes)
| Page | Mobile perf / a11y / BP / SEO | Desktop perf / a11y / BP / SEO |
|---|---|---|
| Home | 28 / 100 / 100 / 100 | 39 / 97 → 100 after tab-contrast fix / 100 / 100 |
| Work | 84 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| About | 79 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| Contact | 84 / 100 / 100 / 100 | 99 / 100 / 100 / 100 |
Home performance is dominated by WebGL drawn on the CPU in this sandbox: the same page with WebGL disabled scores 96 (LCP 1.3 s, TBT 0 ms). Real devices draw on the GPU, so expect far better, but **measure on a real phone**. Changes made to help: no ambient field on phones/low-core machines on the home page, robot renders at 30 fps when idle, layout shift on Work and Contact removed (CLS 0.51 / 0.12 → 0).

## Other checks
- No horizontal scroll on any page at 320, 360, 390, 768, 1024 px (fixed: About stats overflowed at 360 px).
- All internal links and media files exist; 17 GitHub links, 3 YouTube demos verified.
- Demo videos: WebM fallback added for browsers without H.264; reduced-motion users can now play videos (they never loaded before).
- SEO: unique titles/descriptions/OG on every page, `sitemap.xml`, sitemap in `robots.txt`, 404 marked `noindex`.

## Needs manual testing
Real iPhone/Android, Safari, Firefox; real GPU performance; screen readers (VoiceOver, NVDA); a real form submission and FormSubmit activation; LinkedIn and Streamlit links (not reachable from here).
