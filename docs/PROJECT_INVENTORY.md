# Project inventory and prioritisation

Sources checked: the existing site content (`content/projects.json`), the public GitHub repositories listed by the GitHub API for `asad-gulshair` (41 public repos, read on 2026-10-12), the READMEs of the TurtleBot3 repos, and the recruiter-platform screenshots supplied by Asad. LinkedIn could not be read (sign-in wall). Private repos were not visible.

Status labels on the site: PRODUCTION, CURRENT ROLE, PUBLISHED, PROTOTYPE, DEMO, RESEARCH.

## Featured (home page industry guide, ranked by evidence + client demand)
| # | Project | Category | Status | Evidence | Ownership |
|---|---|---|---|---|---|
| 1 | Weld line inspection system | Industrial | Prototype | Public repo with a recorded demo (now on the site), README | Own work (internship) |
| 1a | Parcel counting on a conveyor | Industrial | Demo | YouTube Short on Ultra Vision (real footage, pretrained model, "not a client system") | Own work |
| 1b | Weld defect detection | Industrial | Prototype | Public repo (3 stars), real model output image, ~90% mAP (validation) in README | Own work (internship) |
| 2 | Flange and disk dimension check | Industrial | Prototype | 3 public repos, real output frame, YouTube demo | Own work (internship) |
| 3 | Paint surface defect detection | Industrial | Prototype | Public repo, real output images | Own work |
| 4 | HR recruitment and onboarding workflow | Recruitment | Current role | Sanitised screenshots of the platform | Built in current role; employer owns it, code private |
| 5 | Subtitle and transcription SaaS | Agents | Production | Stated by Asad; no public code or screenshots | Built at previous employer |
| 6 | n8n reporting automations | Agents | Production | Stated by Asad | Built at previous employer |
| 7 | Tomato ripeness grading | Agriculture | Demo | Video with real model overlays | Own work |
| 8 | Smart farming (IEEE Access 2025) | Agriculture | Published | Peer-reviewed paper + 4 repos | Co-author (collaborative) |
| 9 | TurtleBot3 mapping, navigation, obstacle detection | Robotics | Prototype (simulation) | 2 public repos, real SLAM map file | Own work |

## Archive (Work page)
Weld line inspection system, resume screening (research), RAG pipeline (research), invoice-to-Excel tool (live Streamlit app, private repo), medicine recommendation (prototype, no metrics), potato disease CNN (research), orange detection (demo), poultry count (demo).

## Not added (and why)
- Garbage-Waste-Detection (2024 CNN classifier, basic), Heart attack / heart disease models, Titanic, Iris, credit-card fraud, linear regression, PCA, Corona analysis, R visualisations, Excel dashboards, Unicorn startup analysis, rentals correlation: coursework or tutorials, little client relevance.
- Voice emotion detection, multi-input animal classification: research notebooks without a business problem stated.
- PDF generator: utility, not AI.
- stripsnap: work in progress (no README).

## Gaps to fill for stronger case studies
- Real screenshots or screen recordings for: subtitle SaaS, n8n automations, RAG pipeline, invoice tool, smart farming app.
- A short Gazebo/RViz recording for the TurtleBot3 project.
- Box counting project files.
