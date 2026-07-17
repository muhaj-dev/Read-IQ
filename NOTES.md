# Codex build notes

- 2026-07-17 — Added a key-safe `GET /api/ai` health check to the Vercel proxy so deployment and server-side configuration can be confirmed from a browser without making a model request.

- 2026-07-17 — Chose a small Vercel proxy for the OpenAI migration so the API key stays server-side. Added an allowlisted, dependency-free proxy scaffold; the user will deploy it from the `server` root directory before the Expo client is migrated to its URL.

- 2026-07-16 — Scaffolded a greenfield Expo Router app and translated the supplied readIQ brief into `AGENTS.md`. Chose an Expo Go-friendly first slice with local demo state so the entire product story can be tested before adding native integrations or unverified API model strings.
