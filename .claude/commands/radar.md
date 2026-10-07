# /radar - Wizard: Radar konkurencji YouTube z agentem Codex SDK

Przeczytaj w całości plik `WIZARD.md` z katalogu głównego tego repo i przeprowadź użytkownika przez
fazy F0 -> F6 dokładnie w tej kolejności, z testem zaliczenia po każdej fazie. Zasady z sekcji
„ZASADY” w `WIZARD.md` i z `AGENTS.md` obowiązują bez wyjątków.

Najważniejsze w skrócie: bez klucza OpenAI API (silnik na koncie ChatGPT); klucze do danych
(YouTube Data API, Apify) wpisuje użytkownik w panelu; dane pobiera appka, agent analizuje tylko
w `data/agent/`; panel pod `https://DOMENA` za hasłem, przed nim Caddy; hasło i klucze pytasz polem
formularza, nie w czacie; pliki wdrożenia kopiujesz z `deploy/`, parser kodu urządzenia
z `templates/`, nie piszesz własnych.

Skille Matta Pococka (F1) instalujesz lokalnie, całą paczkę:
`npx skills@latest add mattpocock/skills -a claude-code -s '*'`. Wywołujesz je jako
`/grill-with-docs`, `/to-spec`, `/to-tickets` (w Codexie: `-a codex` i `$grill-with-docs` itd.).
