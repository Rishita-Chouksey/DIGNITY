# Status

## Implemented
- PostgreSQL/pgvector Compose and portable SQL migration; FastAPI models, CRUD, token guard, query logging, deterministic hard/soft matching, rule fallback extraction, evaluation fixture, and Next.js pages.
- Every card repeats the cautious eligibility disclaimer; seed data contains official URLs and begins as `verification_due`.

## Important limitations / deviations
- This environment's process runner failed before launching any command (`helper_unknown_error: setup refresh had errors`). Therefore I could not truthfully run Docker, pytest, uvicorn/curl, `npm run build`, Playwright, or create screenshots in `/docs/screenshots`. These are pending local verification.
- Description embedding persistence on admin create/update is not completed: the matcher implements the required one-query pgvector similarity path, but model-column mapping and embedding write need a follow-up migration/implementation before semantic ranking is active. The current offline deterministic rules still rank safely.
- The optional OpenAI provider needs `openai` installed when enabled; offline fallback is fully designed for no API key.
- The admin UI supports create/delete/verify. Full field-form edit is still a backend endpoint rather than a polished UI form.

## Deliberately out of scope (Phase 2/3)
- Saved schemes, reminders, voice input, analytics, user accounts, application submission, payments, autonomous agents, and multi-turn chat.
