# Proposal: conversational Scout (not implemented)

The shipped guide is predefined and needs no backend. A conversational version would be worth it only if visitors ask questions the menu cannot answer.

**Architecture**
1. Browser: the existing guide panel gets a text box. It sends `{question, page}` to one endpoint. No keys in the browser.
2. Endpoint: a small serverless function (Cloudflare Worker, Vercel function, or Google Apps Script) holds the model API key as a secret, rate-limits by IP (for example 10 questions per hour) and caps answer length.
3. Grounding: the function loads `content/projects.json` and `content/site.json` from the live site and passes only those as context, with an instruction to answer only from them, cite project slugs, and say "I don't know, please ask Asad" otherwise.
4. Output: answer text plus suggested case-study slugs, rendered with the same cards and the same "Discuss this" link.
5. Safety: no storage of questions by default; an allow-list of topics; refusal for personal or unrelated requests; logging only counts.

**Cost and risk:** small per-question cost; main risk is wrong or invented claims, which the grounding and refusal rules reduce but do not remove. Recommend shipping it behind a "beta" label and reviewing answers for two weeks.

Needs from Asad: a model provider account and a place to host the function. Nothing here is live.
