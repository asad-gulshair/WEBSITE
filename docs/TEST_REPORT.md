# Test report (2026-10-12)

Tested with Playwright + Chromium (software WebGL) against a local static server.

**Passed**
- All five pages load with no page errors (the ambient and aperture modules were blocked in some runs only to speed up screenshots).
- Home at 1440×900 and 1366×860: intro, hero, Scout greeting, industry guide (5 tabs), recruiter screens, CV scoring demo, services, process, contact.
- Guide: opens from "Ask my guide", the dock and the phone launcher; topic answers show case studies; focus moves into the answer; Esc closes and returns focus.
- Phone 390×844: no horizontal scroll; launcher sits above the quick-contact bar; panel opens as a bottom sheet.
- Reduced motion: intro hidden, robot drawn still, panel works.
- No WebGL (`--disable-webgl`): drawn face fallback, panel works, no errors.
- Project deep link `projects.html#/work/medicine-recommendation` opens the case study.

**Not tested**
- Real GPUs, Safari/iOS, Firefox, screen readers (NVDA/VoiceOver).
- The live GitHub Pages deploy (nothing pushed yet).
- Form delivery to a real endpoint (no endpoint configured); external links (GitHub, IEEE, Streamlit) not fetched from here.
