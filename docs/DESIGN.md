# Design and architecture note

**Stack decision:** kept the existing static site (HTML, CSS, vanilla ES modules, Three.js from a local file, no build step). It already deploys to GitHub Pages from `main`, loads fast and is editable through Pages CMS. A React/Next migration would add a build pipeline without changing what visitors see, so it was not justified.

**Art direction:** dark charcoal base, warm orange as the brand accent, cyan and violet used only for light (robot rims, hero aurora, process line, ambient field). Geist for type. Glass only on floating UI (guide bubble, panel).

**Motion storyboard (kept to a few strong moments):**
1. Intro curtain (once per session, CSS only, about 1 s).
2. Hero: copy rises in; Scout flies up, waves and greets; the Aperture lens animates behind.
3. Ambient 3D field follows scroll and cursor.
4. Industry guide: tab switch animates the panel; Scout comments.
5. Recruiter screens: pinned 3D stack driven by scroll.
6. CV scoring demo: scan, scores fill, human decision; Scout reacts.
7. Process line draws across the five steps.
All motion respects `prefers-reduced-motion`; WebGL failures fall back to stills.

**Scout, the portfolio guide (`companion.js` + `guide.js`):** one procedural Three.js character (no model download), canvas face texture for expressions, one renderer per canvas, paused off-screen. Predefined interactions only: section lines, interest menu (manufacturing, HR, documents, LLM/RAG, custom), problem → solution → related case studies → "Discuss this" link that pre-fills the form topic. Docks bottom-left on wide screens, launcher button on phones, hidden over the recruiter and scoring sections. Esc closes; focus returns to the opener. No-WebGL: a drawn face stands in and the panel still works.

**Contact path:** form posts to `contact.formEndpoint` (Google Apps Script in `tools/lead-capture.gs`, or Formspree); without an endpoint it opens a pre-filled email. Fields: name, email, company, need, budget, timeline, reply method, phone, details.

See `GUIDE_AI_PROPOSAL.md` for a possible conversational version.
