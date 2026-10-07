# Twój Codex w appce: Radar konkurencji YouTube na własnym serwerze 📡

Zbuduj własną aplikację z agentem AI w środku. Agent to silnik Codexa wbudowany przez
`@openai/codex-sdk`, zalogowany **Twoim kontem ChatGPT** (bez klucza OpenAI API). Appka czyta nowe
filmy, komentarze i napisy z kanałów konkurencji i układa raport: o co pytają widzowie, na co
narzekają, czego jeszcze nikt nie nagrał. Stoi na Twoim VPS pod Twoim adresem, dostępna z telefonu,
za hasłem.

Gotowe prompty do wklejenia + instrukcja krok po kroku + mój przebieg jako przykład.
Strona z przyciskami „Kopiuj”: **https://szewowsky.github.io/codex-sdk-radar/**

## Dla kogo?

Płacisz za ChatGPT (Plus / Pro / Business), używasz Claude Code albo Codexa i chcesz mieć **własne narzędzie**,
w którym ten sam agent pracuje dla Ciebie w tle. Nie musisz programować: plan robi agent, kod
pisze agent, Ty podajesz dane i klikasz logowania. Jeśli chcesz zbudować coś innego niż radar,
podmieniasz jeden akapit w promptach i jedziesz tą samą drogą.

## Co dostajesz?

- **Prompty do wklejenia** - przepytanie z wizji, budowa, wdrożenie (sekcja „Krok po kroku” niżej
  i `docs/prompts.md`)
- **Wizard dla agenta** - `WIZARD.md`: fazy F0-F6 z testem zaliczenia i ścianami, które już znamy
- **Schemat raportu** - `docs/schema.json` (outputSchema dla Codex SDK)
- **Pliki wdrożenia** - `deploy/`: Dockerfile, docker-compose.yml z Caddy, Caddyfile, `.env.example`,
  profile sandboxa i skrypt na jedno `sudo`
- **Mój przebieg** - ramki „U mnie” pokazują, co wyszło u mnie na Hostingerze

## Wymagania

| Co | Minimum |
|----|---------|
| Konto | ChatGPT Plus / Pro / Business z dostępem do Codexa |
| Komputer | Node.js 22+, Claude Code (`npm i -g @anthropic-ai/claude-code`), Codex CLI zalogowany kontem ChatGPT (`codex login status`) |
| Dane | konto Google: klucz YouTube Data API v3 (darmowy, 10 000 jednostek dziennie); opcjonalnie konto Apify (napisy, darmowy plan 5 USD/mies.) |
| Serwer | VPS z Ubuntu 24.04 + Docker z Compose v2 (`docker compose version` → v2.x). Hostinger: szablon „Ubuntu 24.04 z Dockerem”; inny: `curl -fsSL https://get.docker.com \| sh`. Nic więcej na serwerze nie instalujesz. Bez serwera: zatrzymujesz się po Kroku 4 i appka działa na laptopie |
| Dostęp do appki | `https://srvXXXXXX.hstgr.cloud` (darmowa subdomena Hostingera) albo własna domena; HTTPS przez Caddy, wejście hasłem do panelu |
| Nie potrzebujesz | klucza OpenAI API, frameworka, Tailscale ani tunelu |

Nie masz jeszcze VPS? Ja korzystam z [Hostingera](https://www.hostinger.com/roberthost10)
(partner technologiczny kanału), kod **ROBERTHOST** daje dodatkowy rabat.

## Quick Start

### Opcja A: Wklej jeden prompt agentowi (zalecane - tak robię to w filmie)

Otwórz Claude Code w nowym, pustym folderze i wklej (Codex też da radę: `$skill` zamiast
`/skill`):

```text
Sklonuj repozytorium https://github.com/Szewowsky/codex-sdk-radar.git do podfolderu konfigurator/
w bieżącym katalogu, przeczytaj jego WIZARD.md w całości i przeprowadź mnie przez opisany tam wizard budowy
„Radaru konkurencji YouTube” z agentem Codex SDK w środku - dokładnie według jego zasad
i kolejności faz od F0 do F6. Idź krok po kroku: po każdej fazie pokaż test zaliczenia i nie
przechodź dalej, jeśli nie przeszedł. Zacznij od sprawdzenia wymagań (F0), potem instalacja
skilli Matta Pococka (F1), przepytanie mnie z wizji, specyfikacja i tickety (F2), budowa
lokalna w bieżącym katalogu, nie w konfigurator/ (F3), wdrożenie na mój VPS z gotowych plików
z konfigurator/deploy/ (F4), ekran startowy
z logowaniem ChatGPT i kluczami (F5) i pierwszy przebieg z testem pamięci (F6). Zasady: bez
klucza OpenAI API (silnik jedzie na moim koncie ChatGPT); dane pobiera appka (RSS, YouTube
Data API, opcjonalnie Apify), a agent tylko je analizuje w folderze data/agent/
w trybie workspace-write; bezpiecznik czasu na każdą turę; panel pod moją domeną po HTTPS,
za hasłem. Hasło do panelu ustalam polem formularza, klucze YouTube i Apify wpisuję w panelu
appki - żadne hasło ani klucz nie idzie przez czat. Po ticketach przejdź do budowy sam, bez
czekania na nowe prompty ode mnie - wymagania z WIZARD.md traktuj jako część speca. Logowania
(ChatGPT, Hostinger) robię sam - Ty mówisz, gdzie kliknąć.
```

Agent zapyta Cię o kanały i dane serwera, przepyta z wizji, zrobi spec i tickety, a potem **sam**
zbuduje i wdroży appkę - Ty odpowiadasz na pytania, wpisujesz hasło w pole formularza i klikasz
logowania. Kolejnych promptów nie wklejasz.

### Opcja B: Krok po kroku, ręcznie wklejając prompty

Sekcja niżej. Każdy krok = jedna wklejka + „U mnie”.

### Opcja C: Masz już appkę, chcesz tylko agenta w środku

Przeczytaj `WIZARD.md` F3c (serce appki: 20 linii TypeScriptu) i `docs/schema.json`.

## Krok po kroku

### Krok 1 - Sprawdź, że masz, czego trzeba, i wyrób klucze (10 min)

```bash
node -v && claude --version && codex login status && claude plugin list
```

Ma być: Node 22+, wersja Claude Code, `Logged in using ChatGPT`, na liście wtyczek
`hostinger@claude-plugins-official` (jeśli serwer na Hostingerze). Brak Claude Code:
`npm i -g @anthropic-ai/claude-code`. Brak Codexa: `npm i -g @openai/codex && codex login`.

Wtyczka Hostingera w Claude Code (raz): `claude plugin install hostinger@claude-plugins-official`,
potem w sesji `/mcp` → hostinger → zaloguj w przeglądarce. Daje agentowi listę Twoich VPS-ów,
adresy i subdomenę `hstgr.cloud` bez przeklikiwania panelu.

**Klucz YouTube Data API** (darmowy, 10 000 jednostek dziennie; radar zużywa ułamek procenta):
https://console.cloud.google.com → nowy projekt → „APIs & Services” → „Enable APIs” →
**YouTube Data API v3** → Enable → „Credentials” → „Create credentials” → **API key**. Klucz
zaczyna się od `AIzaSy`. Podajesz go **w panelu appki** po wdrożeniu (Krok 6), nie agentowi - ale
wyrób go teraz, żeby nie czekać.

**Token Apify** (opcja, do napisów): https://console.apify.com → Settings → Integrations →
**Personal API tokens**. Darmowy plan ma 5 USD kredytu miesięcznie, transkrypt kosztuje ok.
0,001 USD. Bez tokena radar działa na komentarzach, tytułach i opisach.

Serwer: Hostinger - agent przez wtyczkę wylistuje VPS-y i zapyta, który; Ty podajesz użytkownika
i port SSH. Czysty VPS: szablon **Ubuntu 24.04 z Dockerem**. Domena: darmowa
`srvXXXXXX.hstgr.cloud` (wskazuje na IP serwera od razu) albo własna z rekordem A na IP serwera.

> **U mnie:** Node v22, Codex CLI 0.160. Konto ChatGPT Pro. Serwer: Hostinger KVM 4.

### Krok 2 - Zainstaluj skille Matta Pococka (3 min)

Skille to gotowe procedury dla agenta: przepytanie z wizji, specyfikacja, cięcie na zadania.
Dzięki nim agent nie zgaduje, czego chcesz. Repo: https://github.com/mattpocock/skills

```bash
mkdir radar && cd radar && git init
npx skills@latest add mattpocock/skills -a claude-code -s '*'
```

`-a claude-code` = dla Claude Code (`-a codex` dla Codexa), `-s '*'` = **cała paczka** (skille
odwołują się do siebie nawzajem), bez `-g` = **lokalnie w tym projekcie**: pliki lądują
w `.agents/skills/`, a Claude Code dostaje do nich dowiązania w `.claude/skills/`. W tym poradniku
używamy `setup-matt-pocock-skills`, `grill-with-docs`, `to-spec`, `to-tickets`, `implement`.

Potem w agencie uruchom raz konfigurację: `/setup-matt-pocock-skills` (Codex:
`$setup-matt-pocock-skills`). Odpowiedzi: tracker = pliki lokalne, etykiety = domyślne, dokumenty = `docs/`.

Test: `ls .agents/skills` pokazuje całą paczkę (38 folderów), `/grill-with-docs` jest na liście komend.

> **U mnie:** Claude Code czyta skille przez dowiązania w `.claude/skills/`, Codex te same pliki
> z `.agents/skills/`. Jedna instalacja, oba agenty.

### Krok 3 - Daj się przepytać, potem spec i tickety (15 min)

Wklej w Claude Code:

```text
/grill-with-docs Chcę zbudować „Radar konkurencji YouTube”: aplikację www tylko dla mnie,
dostępną z telefonu pod moją domeną za hasłem, w której podaję kanały konkurencji, a agent
oparty o Codex SDK (@openai/codex-sdk, zalogowany moim kontem ChatGPT, bez klucza OpenAI API)
analizuje nowe filmy, komentarze i napisy i układa raport. Przepytaj mnie z wizji.
```

Agent zada rundę pytań. Gotowe odpowiedzi domyślne (nowe filmy z RSS, komentarze i opisy
z YouTube Data API, napisy opcjonalnie z Apify, dane pobiera appka, a agent analizuje, wejście
hasłem, ekran startowy z logowaniem ChatGPT, raport w 3 listach, pamięć wątku przez `resumeThread`)
są w `docs/prompts.md` (P1, wklejka hurtem) i w pełnej tabeli `WIZARD.md` F2a. Potem:

```text
/to-spec
```

```text
/to-tickets
```

Dostajesz `docs/spec.md` i folder z ticketami (dobry podział to 8). Przeczytaj spec: źródła danych
(RSS + YouTube Data API + Apify opcjonalnie), appka pobiera / agent analizuje, hasło do panelu,
ekran startowy, Caddy przed appką. Żaden ticket nie wymaga klucza OpenAI API. Docker i Caddy nie
są ticketem: pliki są gotowe w `deploy/`.

> **U mnie:** jedna runda, 18 pytań z gotowymi odpowiedziami z tabeli F2a. Odpisałem „all” - wszystko,
> co w v1 musiałem dorzucać ręcznie (logowanie z panelu, model i effort), jest już w wizardzie.

Materiał towarzyszący do filmu na YouTube. Kanał: [Robert Szewczyk](https://youtube.com/@robert_szewczyk)
