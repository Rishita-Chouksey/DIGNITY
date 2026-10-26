# Status

## Implemented
- **PostgreSQL / pgvector schema & migrations**:
  - `001_initial.sql` defines core scheme attributes, pgvector HNSW indexing, search query logging, and categories.
  - `002_apply_guide.sql` introduces application guidance: `apply_url`, `application_mode` (`online`, `offline`, `both`), `application_steps` (`[{"step": int, "title": text, "detail": text}]`), `helpline`, `offline_office`, `procedure_source_url`, and migrates `required_documents` from plain string arrays to `[{"name": text, "where_to_get": text|null, "note": text|null}]`.
- **Recommendation & Scoring Engine**:
  - Combined deterministic hard/soft matching with pgvector semantic similarity (`all-MiniLM-L6-v2`) and keyword lexical fallback.
  - Granular scoring resolves identical percentage badges across candidates; scores now reflect criteria match + semantic relevance.
  - Gender filtering and special category validation prevent incompatible recommendations (e.g., female-only schemes are excluded for male applicants).
  - Universal public schemes (e.g., food security, healthcare) are recognized with baseline eligibility for qualifying age/state.
- **Truthfulness Rule & Application Guidance**:
  - Strict compliance with DIGNITY boundaries: guidance only, no external form submission, no user logins, no government ID storage.
  - Unverified procedures display "Procedure not yet verified — please follow the official page".
  - Verification gate: Admins cannot mark schemes as `verified` (via API or Admin UI) unless both `apply_url` and `procedure_source_url` are provided from official sources.
- **Admin Management UI (`/admin`)**:
  - Form editor with dual mode (interactive form or raw JSON).
  - Ordered Application Steps editor with step numbering, Add, Move Up, Move Down, and Remove controls.
  - Document rows editor supporting `name`, `where_to_get`, and `note`.
  - Application mode selector (`online`, `offline`, `both`), helpline, offline office, and official URLs.
  - Real-time verification gate preventing verification when official links are missing.
- **Scheme Detail Page (`/schemes/[id]`)**:
  - "How to apply" section with application mode badge, numbered steps, interactive browser-only document checklist (state stored locally in React state, no account/server storage), helpline phone link, prominent "Open official application page" button (opens in new tab with `rel="noopener noreferrer"`), and print stylesheet support (`Print / Save as PDF`).
  - Truthful source footer: `"Steps summarised from the official source on <last_verified>. Portals change — confirm on the official page before applying."`
- **Link Validation & Evaluation Fixtures**:
  - Link check script (`backend/eval/check_links.py`) validates `official_url` and `apply_url` via live HTTP requests and exports results to `eval/link_report.md`.
  - Evaluation suite (`backend/eval/run_eval.py`) achieves 1.00 recall and 1.00 top-K accuracy across fixture profiles.
  - Test suite (`pytest` in `backend/tests/`) passes 10/10 tests covering schema migration, application mode validation, admin verification gates, and matching rules.
  - Frontend build (`next build`) compiles cleanly across all routes with zero errors.

## Important limitations / deviations
- Seeded schemes currently begin in `verification_due` status. Because official application portals change frequently, procedure steps and application URLs are left empty until manually verified by an administrator, correctly showing "Procedure not yet verified". No fake procedure steps or fake phone numbers are hallucinated.
- LLM extractor uses rule-based fallback when `LLM_PROVIDER=none` or when no OpenAI API key is configured. Offline fallback regex accurately extracts age, state, occupation, income, special categories, and gender.
- Embeddings are generated locally using `sentence-transformers` (`all-MiniLM-L6-v2`). When `embeddings_enabled` is inactive or running in non-PostgreSQL environments (e.g. SQLite unit tests), deterministic rule scoring with lexical overlap fallback ensures consistent execution.

## Deliberately out of scope (Phase 2/3)
- User accounts, Aadhaar / government ID document storage, automatic form submission, payment handling, and autonomous agents.
