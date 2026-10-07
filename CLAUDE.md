# codex-sdk-radar

Wizard budowy „Radaru konkurencji YouTube” z agentem Codex SDK w środku. Źródło prawdy: `WIZARD.md`
(komenda `/radar`). Zasady agenta: `AGENTS.md`.

- Język: polski, znaki Unicode, NIGDY długa pauza (em-dash), zawsze krótki łącznik (-).
- Nie commituj danych użytkownika: `data/`, `codex-home/`, `auth.json`, `.env` (`.gitignore`).
- Bez klucza API w kodzie, env ani Dockerfile. `package-lock.json` w repo, na serwerze `npm ci`.
