# Claims and details for Asad to verify (updated 2026-10-12)

## Checked against evidence
| Claim on the site | Evidence | Status |
|---|---|---|
| 17 projects across 5 areas | `content/projects.json` (17 entries, 5 categories) | OK |
| ~90% mAP, weld defect detection (validation) | Weld-Defect-Detection repo README: "~90% on validation dataset" | OK, label now says "approx." |
| Inspection platform: weld, coating, flange vs ASME, PASS/FAIL | End-to-End repo README | OK (company visuals replaced by original illustrations) |
| Flange measurement ">90% precision" | Flange-Dimension-Compliance-System README | Not shown on the site (no evaluation method given) |
| TurtleBot3: SLAM, Nav2, LiDAR 1 m alert, simulation | Both turtlebot3 repos | OK |
| YouTube demos (flange, orange, poultry) | YouTube oEmbed: all three exist on "Ultra Vision" | OK |
| All 17 GitHub repo links | GitHub API repo list | OK |

## Could not be verified here (please confirm or correct)
- **Employment dates:** About says "Data Scientist, digital media, 2025 to 2026". Your own notes say the data-scientist role started **January 2026**. If so, change it to "2026".
- "2 systems in daily production use" and "about 40% less manual translation work" (subtitle SaaS, n8n automations): no public evidence; they come from your earlier site copy.
- About: "Currently also working on bottle bubble detection and mushroom defect classification" and "rolled out with the operations team".
- Smart-farming accuracies (99.13%, 98.75%, 99.3%, R² 0.987): the IEEE page could not be opened from here; check against the paper.
- HR platform screens and the "built for a manufacturer" wording: confirm your employer is fine with showing them (name, logo, people, age and BMI are removed).
- Invoice to Excel: the Streamlit link could not be opened from here (blocked network); open it once to confirm it works.
- CV scoring section: the four criteria and the plain-average overall are inferred from your screenshots.

## Needs one action from you
- **Enquiry form:** the form posts to FormSubmit (`https://formsubmit.co/ajax/asadgulshair6767@gmail.com`). The first real submission makes FormSubmit email you an "Activate Form" link. Send one test enquiry from the live site and click that link. Until then the form shows an honest error and offers "Email it to me instead". To use a Google Sheet instead, deploy `tools/lead-capture.gs` and put its URL in `content/site.json` → `contact.formEndpoint`.
- Box counting project: send the video or files.

## Images
- Industrial Vision projects now use original 3D illustrations made for this site. The earlier model-output pictures and the demo video from the internship project were removed from the site. They still exist in older commits of the repository; tell me if you want the history rewritten.
- Orange demo: the caption strip naming tools/brands was blurred out.
