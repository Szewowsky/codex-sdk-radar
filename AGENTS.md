# AGENTS.md - instrukcja dla agenta (Codex, Claude Code i inne)

To repo to wizard budowy „Radaru konkurencji YouTube”: aplikacji www z agentem Codex SDK w środku,
zalogowanym kontem ChatGPT użytkownika, wdrożonej na jego VPS. Jedyne źródło prawdy dla agenta:
**`WIZARD.md`** - przeczytaj go w całości i prowadź użytkownika fazami F0 -> F6 dokładnie w tej
kolejności, z testem zaliczenia po każdej fazie.

Zasady, których nie wolno złamać (pełna lista w `WIZARD.md`, sekcja „ZASADY”):

1. **Bez klucza API.** `new Codex()` bez `apiKey`; silnik loguje się kontem ChatGPT użytkownika.
   Nie dodawaj `OPENAI_API_KEY` ani `CODEX_API_KEY` do kodu, env ani Dockerfile.
2. **Jedna wersja SDK:** najnowsza z npm, `package-lock.json` w repo, na serwerze `npm ci`.
3. **Wątek agenta w appce** tylko `sandboxMode: "workspace-write"` w katalogu `data/`,
   `networkAccessEnabled: true`, `approvalPolicy: "never"`, bezpiecznik `AbortSignal.timeout`.
   Nigdy `danger-full-access`.
4. **Appka tylko dla właściciela.** Serwer słucha na `127.0.0.1` (dostęp tunelem SSH; opcjonalnie adres
   Tailscale), nie na publicznym `0.0.0.0` bez hasła. Nie projektuj logowania innych ludzi na konto użytkownika.
5. **Tokeny i `auth.json` nie przechodzą przez czat.** Logowania (Codex device auth, Hostinger
   OAuth) wykonuje użytkownik sam - Ty mówisz, gdzie kliknąć.
6. **Prowadź sam.** Po ticketach (F2) przechodzisz do budowy (F3) i wdrożenia (F4) bez czekania na
   nowe prompty; wymagania z `WIZARD.md` F2a/F3b są częścią speca. Pytasz tylko przy testach
   zaliczenia faz i logowaniach.
7. **Czekaj na wynik każdej komendy.** Test fazy nie przeszedł -> STOP, pokaż output, zapytaj.
   Na serwerze niczego nie usuwaj.

Skille Matta Pococka (F1) instalujesz w całości (cała paczka, nie wybrane) i lokalnie w projekcie (bez `-g`) przez
`npx skills@latest add mattpocock/skills -a codex -s '*'` (Codex) albo
`claude plugins install mattpocock-skills` (Claude Code). Schemat raportu: `docs/schema.json`.
Prompty do wklejenia: `docs/prompts.md`.
