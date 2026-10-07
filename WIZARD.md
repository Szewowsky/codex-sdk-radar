# WIZARD - Radar konkurencji YouTube z agentem Codex SDK, od zera do serwera

Cel: po tym wizardzie masz **własną aplikację z agentem w środku**. Agent to silnik Codexa wbudowany
w appkę przez `@openai/codex-sdk`, zalogowany **Twoim kontem ChatGPT** (bez klucza API). Appka
czyta nowe filmy i komentarze z kanałów konkurencji i układa raport: o co pytają widzowie, na co
narzekają, czego jeszcze nikt nie nagrał. Działa na Twoim VPS, widoczna tylko dla Ciebie.

Agent (Codex albo Claude Code) prowadzi, Ty podajesz dane, klikasz linki logowania i zatwierdzasz
plan. Fazy F0 -> F6, po każdej test zaliczenia. **Nie przechodź dalej, gdy test nie przeszedł.**

## ZASADY (agent ich nie łamie)

1. **Jeden folder dla agenta w appce.** Wątek Codexa pracuje w `workspace-write` w katalogu
   `data/` radaru i nigdzie indziej. Nigdy `danger-full-access`.
2. **Sieć włączasz świadomie.** Domyślnie wątek nie ma internetu. Włączasz ją polem
   `networkAccessEnabled: true` przy starcie wątku, bo radar musi pobrać RSS i komentarze.
3. **Jedna wersja SDK na laptopie i serwerze.** Instalujesz najnowszą z npm, a `package-lock.json`
   commitujesz; na serwerze `npm ci` bierze dokładnie tę samą. Nowe wersje wychodzą co 2-4 dni,
   więc aktualizację robisz świadomie (`npm update`), nie przypadkiem.
4. **Bezpiecznik na każdą turę.** `signal: AbortSignal.timeout(...)`. Każda akcja agenta zjada
   limit Codexa na Twoim koncie; przebieg bez hamulca potrafi zjeść dzienną pulę.
5. **Logowanie = hasło.** Plik `auth.json` w `CODEX_HOME` traktujesz jak hasło: nie wkleja się go
   do czatu, nie commituje, na serwerze leży w wolumenie z prawami `0600`.
6. **Appka tylko dla Ciebie.** Słucha na `127.0.0.1` (na serwerze wchodzisz tunelem SSH), nigdy na
   publicznym `0.0.0.0` bez hasła. Nie wpuszczasz innych ludzi na swój abonament (regulamin OpenAI zabrania
   współdzielenia konta). Appka dla innych = Sign in with ChatGPT albo klucz API, nie ten wizard.
7. **Tokeny nie przechodzą przez czat.** Logowanie Codexa i Hostingera robisz sam
   linkiem albo kodem urządzenia. Agent mówi, gdzie kliknąć.
8. **Czekaj na wynik komendy.** Agent nie łączy faz i nie zgaduje, że coś się udało.
   Test nie przeszedł -> STOP, pokaż output, zapytaj.

Placeholdery w komendach: `USER`, `IP`, `PORT` (SSH),
`RADAR_DIR` (folder appki). Zawsze podstawiaj faktyczne wartości z F0.

---

## F0 - Wymagania i dane (ok. 5 min)

Agent sprawdza na Twoim komputerze i pyta o resztę.

**Sprawdź komendami:**

```bash
node -v            # potrzebne 18+, polecane 22 LTS
codex --version    # Codex CLI zainstalowany (npm i -g @openai/codex)
codex login status # ma być: "Logged in using ChatGPT"
yt-dlp --version   # komentarze; brak -> brew install yt-dlp / pipx install yt-dlp
```

**Zapytaj użytkownika:**

- **Kanały konkurencji** - 3 do 5 linków (`https://www.youtube.com/@nazwa`). Więcej kanałów =
  dłuższy przebieg i większe zużycie limitu.
- **Serwer** - adres SSH (`USER@IP`, `PORT`) i Docker z pluginem Compose v2: test
  `ssh -p PORT USER@IP docker compose version` (ma zwrócić `v2.x`). Czysty serwer: Hostinger ->
  szablon **Ubuntu 24.04 z Dockerem** przy tworzeniu VPS / Reinstall OS; inny Ubuntu 22.04/24.04 ->
  `curl -fsSL https://get.docker.com | sh` (paczka `docker.io` z apt bywa stara i bez Compose v2).
  Nic więcej na serwerze nie instalujesz: Node, yt-dlp i Codex siedzą w obrazie kontenera.
  Panel na serwerze słucha na `127.0.0.1`, wchodzisz tunelem SSH: `ssh -L 3000:127.0.0.1:3000 -p PORT USER@IP`.
- **Dostawca** - Hostinger (wdrożenie przez connector w Codexie, F4) czy inny (wdrożenie przez
  SSH, też F4, wariant B).
- **Plan ChatGPT** - Plus / Pro / Business. Agent jedzie na tej samej puli co Codex na Twoim
  koncie; zużycie widzisz w ustawieniach ChatGPT.

**Test zaliczenia F0:** cztery komendy przeszły, lista kanałów i dane serwera zapisane w czacie,
użytkownik wie, że limit Codexa jest wspólny.

---

## F1 - Skille Matta Pococka (ok. 3 min)

Zamiast pisać do agenta „zbuduj mi radar” i liczyć na szczęście, najpierw robisz plan trzema
skillami: **przepytanie z wizji -> specyfikacja -> małe zadania**. Skille są open source
(MIT): https://github.com/mattpocock/skills

**Codex (i każdy inny agent):**

```bash
mkdir radar && cd radar && git init
npx skills@latest add mattpocock/skills -a codex -s '*'
```

Flagi: `-a codex` = tylko dla Codexa, `-s '*'` = **cała paczka** (skille odwołują się do siebie
nawzajem, np. `to-spec` korzysta z `grill-with-docs`, a `implement` z `tdd`). **Bez `-g`** = instalacja
lokalna, per projekt: pliki lądują w `.agents/skills/` w tym repo, nie w katalogu domowym. Inny
projekt = osobna instalacja, a to repo działa u każdego, kto je sklonuje. W tym wizardzie używamy: `setup-matt-pocock-skills`, `grill-with-docs`, `to-spec`,
`to-tickets`, `implement`.

**Claude Code:** `claude plugins install mattpocock-skills` (oficjalny marketplace, bez dodawania).

Potem w agencie uruchom raz konfigurację:

```text
$setup-matt-pocock-skills
```

(w Claude Code: `/setup-matt-pocock-skills`). Odpowiedzi: issue tracker = **pliki lokalne**,
etykiety = domyślne, dokumenty = `docs/`.

**Test zaliczenia F1:** `ls .agents/skills` pokazuje całą paczkę (kilkanaście folderów, w tym
`grill-with-docs`, `to-spec`, `to-tickets`) (Codex) albo `/grill-with-docs`
jest na liście komend (Claude Code); setup zapisał konfigurację bez błędu.

---

## F2 - Plan: przepytanie, specyfikacja, tickety (ok. 15 min)

### F2a - Przepytanie z wizji

W Codexie:

```text
$grill-with-docs Chcę zbudować „Radar konkurencji YouTube”: aplikację www tylko dla mnie,
w której podaję kanały konkurencji, a agent oparty o Codex SDK (@openai/codex-sdk, zalogowany
moim kontem ChatGPT, bez klucza API) sprawdza nowe filmy i komentarze i układa raport.
Przepytaj mnie z wizji.
```

Agent zada rundę pytań. Gotowe odpowiedzi (zmień, co chcesz):

| Pytanie | Odpowiedź domyślna |
|---|---|
| Skąd nowe filmy? | RSS kanału: `https://www.youtube.com/feeds/videos.xml?channel_id=UC...` (bez klucza API). `channel_id` z handle: `yt-dlp --print channel_id --playlist-items 1 "https://www.youtube.com/@nazwa"` |
| Skąd komentarze? | `yt-dlp --skip-download --write-info-json --write-comments --extractor-args "youtube:max_comments=100,all,0,0" URL` - do 100 komentarzy na film, bez odpowiedzi |
| Skąd treść filmu? | transkrypcja z napisów: `yt-dlp --skip-download --write-auto-subs --sub-lang pl,en --sub-format vtt URL` (napisy auto, 0 zł); bez napisów film pomijamy w analizie treści |
| Ile filmów na kanał na przebieg? | 3 najnowsze z RSS, tylko nowsze niż ostatni przebieg; transkrypcja przycięta do ok. 3000 słów na film (limit tokenów) |
| Co w raporcie? | 3 listy: pytania widzów, narzekania, luki tematyczne (czego nikt nie nagrał). Każda pozycja: tytuł, 1 zdanie, kanał/film źródłowy, siła (niska/średnia/wysoka), czy już zgłaszane w poprzednim przebiegu |
| Kto pobiera dane: appka czy agent? | **Agent.** Appka tylko odpala turę wątku z zadaniem „pobierz i przeanalizuj”, agent sam uruchamia yt-dlp i czyta RSS w `data/`. Dzięki temu widać ślad kroków agenta w panelu |
| Panel www | Node 22 + Express (albo Fastify), HTML bez frameworka. Widoki: lista kanałów (dodaj/usuń), przycisk „Przebieg”, ślad kroków agenta na żywo, raport w kafelkach, historia przebiegów |
| Baza | pliki JSON w `data/` (`channels.json`, `runs/<data>.json`, `state.json` z `threadId`). SQLite dopiero, gdy JSON przestanie wystarczać |
| Pamięć agenta | po pierwszym przebiegu zapisz `thread.id`; kolejne przebiegi `resumeThread(id)`, żeby agent wiedział, co już zgłaszał |
| Uprawnienia wątku | `sandboxMode: "workspace-write"`, `workingDirectory: data/`, `skipGitRepoCheck: true`, `networkAccessEnabled: true`, `approvalPolicy: "never"` |
| Bezpiecznik | `AbortSignal.timeout(10 * 60_000)` na turę; przerwana tura = raport „przerwano po 10 min” w historii |
| Logowanie silnika z panelu | przycisk **„Zaloguj kontem ChatGPT”** w panelu: appka uruchamia `codex login --device-auth` (binarka z `node_modules/.bin/codex`, env `CODEX_HOME`), wyciąga z wyjścia link `https://auth.openai.com/codex/device` i kod `XXXX-XXXX` (wyjście ma kody kolorów ANSI, trzeba je zdjąć) i pokazuje oba w panelu z przyciskami Kopiuj; proces czeka, aż potwierdzisz w przeglądarce; status przez `codex login status` (kod wyjścia 0 = zalogowany). Logowanie tylko dla właściciela appki, nie dla innych ludzi |
| Wybór modelu i effortu | w ustawieniach panelu dwie listy: model (`gpt-6-luna` domyślnie, do wyboru `gpt-6.1-sol`, `gpt-6-sol`, `gpt-6-astra`; pole `model` w `startThread`) i effort (`low` / `medium` / `high` / `xhigh` / `max`, domyślnie `high`; pole `modelReasoningEffort`). Zapis w `data/settings.json`, czytany przy każdym przebiegu |
| Dostęp | serwer słucha na `HOST` z env (domyślnie `127.0.0.1`), port 3000, bez logowania w appce; na serwerze wchodzisz tunelem SSH |
| Harmonogram | na start ręcznie z panelu; cron w Dockerze jako osobny ticket „później” |
| Testy | smoke: `GET /health`, przebieg na 1 kanale z 1 filmem kończy się raportem zgodnym ze schematem |

### F2b - Specyfikacja

```text
$to-spec
```

Powstaje `docs/spec.md` (albo `.scratch/radar/spec.md`, zależnie od setupu). Przeczytaj ją.
Sprawdź, że są w niej: źródła danych bez klucza YouTube API, opcje wątku z tabeli wyżej,
schemat raportu, bind na `HOST` z env.

### F2c - Tickety

```text
$to-tickets
```

Powstaje folder z zadaniami (`docs/issues/01-...md` itd.). Dobry podział to 6-8 ticketów:
szkielet serwera + panel, kanały (CRUD + channel_id), moduł agenta (SDK), schemat raportu,
przebieg + ślad kroków, historia + resume, Dockerfile/compose, smoke test.

**Test zaliczenia F2:** spec + tickety istnieją, w specu są wszystkie opcje wątku z tabeli,
żaden ticket nie wymaga klucza YouTube API ani klucza OpenAI.

---

## F3 - Build lokalny (ok. 30-60 min, zależnie od agenta)

### F3a - Instalacja Codex SDK

W folderze `radar/` (tym z F1):

```bash
npm init -y
npm install @openai/codex-sdk express
npm pkg set type=module
grep codex-sdk package.json      # wersja z npm (na 06.10.2026: 0.160.1)
ls node_modules/@openai/           # codex-sdk + codex (silnik przyszedł razem z SDK)
```

SDK zależy od `@openai/codex` w tej samej wersji, więc `npm install` ściąga od razu silnik Codexa.
Niczego więcej nie doinstalowujesz; `npx codex --version` w tym folderze pokaże tę samą wersję co SDK. Silnik
w appce używa tego samego logowania co Twój Codex CLI (`~/.codex/auth.json`), chyba że ustawisz
`CODEX_HOME` na inny katalog (tak zrobimy na serwerze w F4).

### F3b - Budowa: agent prowadzi sam

W Opcji A (jeden prompt z README) **nie czekasz na nową wklejkę**: po ticketach agent sam przechodzi
do budowy, ticket po tickecie, według `docs/spec.md`. Zanim napisze pierwszą linię kodu, sprawdza,
czy spec zawiera wszystkie punkty z listy niżej; czego brakuje, dopisuje do speca (to są wymagania
wizardu, nie opcje). Pyta Cię tylko przy testach zaliczenia i przy logowaniach.

Prompt niżej to ta sama lista w formie wklejki - dla Opcji B (krok po kroku) albo gdy agent
zatrzymał się po ticketach i czeka.


Wybór modelu w Codexie (`/model`): mocniejszy model z wyższym effortem jako nadzorca, który
audytuje i zleca kod subagentom. U Roberta: GPT-6.1 Sol (high) nadzoruje, GPT-6 Luna (max)
pisze kod. Na planie Plus wystarczy jeden domyślny model - prompt działa tak samo.

```text
Zbuduj aplikację „Radar konkurencji YouTube” według docs/spec.md i ticketów z docs/issues,
ticket po tickecie, po każdym pokaż mi, co działa. Ty nadzorujesz i audytujesz: pisanie kodu
każdego ticketu zlecaj subagentowi, a sam sprawdzaj wynik przed przejściem dalej. Zasady:
- Agent w środku appki = @openai/codex-sdk (już zainstalowany, najnowsza wersja z npm; jeśli
  brakuje, `npm install @openai/codex-sdk`).
- Bez klucza API: `new Codex()` bez apiKey; SDK ma korzystać z silnika zalogowanego kontem
  ChatGPT (codex login). Nie dodawaj OPENAI_API_KEY nigdzie.
- Opcje wątku: sandboxMode "workspace-write", workingDirectory = katalog data/,
  skipGitRepoCheck true, networkAccessEnabled true, approvalPolicy "never".
- Dane bez YouTube API: nowe filmy z RSS kanału, komentarze i transkrypcje z napisów przez
  yt-dlp (agent sam je pobiera w swojej turze).
- Wynik tury wymuś przez outputSchema z docs/schema.json; sparsuj finalResponse jako JSON.
- Pamięć: zapisz thread.id po pierwszym przebiegu w data/state.json, kolejne przebiegi
  przez resumeThread(id).
- Bezpiecznik: signal: AbortSignal.timeout(10 * 60_000) na każdą turę.
- Logowanie z panelu: przycisk „Zaloguj kontem ChatGPT” uruchamia `codex login --device-auth`
  (binarka z node_modules/.bin/codex, env CODEX_HOME), zdejmuje kody ANSI z wyjścia, pokazuje
  link i kod w panelu z przyciskami Kopiuj, a status bierze z `codex login status`. Do tego
  w ustawieniach wybór modelu (pole model w startThread, domyślnie gpt-6-luna; opcje gpt-6.1-sol,
  gpt-6-sol, gpt-6-astra) i effortu (pole modelReasoningEffort: low/medium/high/xhigh/max,
  domyślnie high), zapis w data/settings.json.
- Ślad kroków: użyj runStreamed() i pokazuj w panelu eventy item.completed na żywo.
- Serwer słucha na process.env.HOST || "127.0.0.1", port process.env.PORT || 3000.
- Na końcu: npm run dev, pokaż mi adres panelu i poczekaj, aż potwierdzę pierwszy przebieg.
```

### F3c - Serce appki (dla orientacji, agent napisze to sam)

```ts
import { Codex } from "@openai/codex-sdk";
import schema from "../docs/schema.json" with { type: "json" };

const codex = new Codex(); // bez apiKey = logowanie kontem ChatGPT z CODEX_HOME
const threadOptions = {
  model: settings.model ?? "gpt-6-luna",
  modelReasoningEffort: settings.effort ?? "high",
  workingDirectory: DATA_DIR,
  skipGitRepoCheck: true,
  sandboxMode: "workspace-write",
  networkAccessEnabled: true,
  approvalPolicy: "never",
} as const;

const thread = state.threadId
  ? codex.resumeThread(state.threadId, threadOptions)
  : codex.startThread(threadOptions);

const { events } = await thread.runStreamed(prompt, {
  outputSchema: schema,
  signal: AbortSignal.timeout(10 * 60_000),
});

let finalText = "";
for await (const ev of events) {
  if (ev.type === "thread.started") state.threadId = ev.thread_id;
  if (ev.type === "item.completed") pushTrace(ev.item);          // ślad w panelu
  if (ev.type === "item.completed" && ev.item.type === "agent_message") finalText = ev.item.text;
  if (ev.type === "turn.completed") state.lastUsage = ev.usage;  // tokeny tury
}
const report = JSON.parse(finalText); // zgodny z docs/schema.json
```

### F3d - Ściany, które mogą wyskoczyć

| Objaw | Przyczyna | Naprawa |
|---|---|---|
| Agent „nie może pobrać” RSS, komenda kończy się błędem sieci | sandbox bez internetu | `networkAccessEnabled: true` w opcjach wątku (albo `new Codex({ config: { sandbox_workspace_write: { network_access: true } } })`) |
| Błąd „not a git repository” / odmowa pracy w `data/` | silnik wymaga repo git | `skipGitRepoCheck: true` |
| `yt-dlp: command not found` w śladzie | brak narzędzia w PATH procesu | zainstaluj lokalnie; w Dockerze dodaj do obrazu (F4) |
| Tura trwa i trwa | za dużo filmów/komentarzy | limit 3 filmów i 100 komentarzy, bezpiecznik 10 min |
| `finalResponse` nie jest JSON-em | schemat za luźny lub brak `outputSchema` | `additionalProperties: false`, wszystkie pola w `required` |
| Panel pusty, 0 eventów | użyty `run()` zamiast `runStreamed()` | przełącz na `runStreamed()` |

**Test zaliczenia F3:** panel pod `http://127.0.0.1:3000`; dodany 1 kanał; przebieg kończy się
raportem w kafelkach zgodnym ze schematem; `data/state.json` ma `threadId`; drugi przebieg
w śladzie pokazuje wznowiony wątek (ten sam `threadId`) i oznacza pozycje „już zgłaszane”.

---

## F4 - Wdrożenie na VPS (ok. 20 min)

### F4a - Pliki wdrożenia (prompt do agenta)

```text
Przygotuj wdrożenie radaru jako projekt Docker:
- Dockerfile na node:22-slim + python3 + yt-dlp (pipx albo pip) + git; `npm ci` z package-lock.json (ta sama wersja SDK co na laptopie).
- docker-compose.yml: usługa radar, restart unless-stopped, porty "127.0.0.1:3000:3000"
  (panel tylko z serwera, wchodzisz tunelem SSH),
  env HOST=0.0.0.0 wewnątrz kontenera, PORT=3000, CODEX_HOME=/codex-home,
  wolumeny ./data:/app/data i ./codex-home:/codex-home.
- Katalog codex-home ma przetrwać restart i aktualizację obrazu: trzyma logowanie (auth.json)
  i wątki (sessions/). Bez niego radar po restarcie zapomni historię i każe logować się od nowa.
- .dockerignore: node_modules, data, codex-home, .git.
Nie uruchamiaj jeszcze nic na serwerze.
```

### F4b - Wariant A: Hostinger przez connector w Codexie

Connector (serwer MCP) daje Codexowi dostęp do Twojego konta Hostingera: lista VPS, dane
serwera, operacje na maszynie. Hostinger ma serwer hostowany z logowaniem OAuth.

**Najprościej: z zakładki Wtyczki w aplikacji Codex** (bez komend). W aplikacji Codex otwórz
**Wtyczki**, znajdź **Hostinger Connector**, kliknij Zainstaluj i Połącz - otworzy się logowanie do
Hostingera, zatwierdzasz i connector jest w Codexie.

**Z terminala (Codex CLI) - ten sam efekt komendami:**

```bash
codex mcp add hostinger --url https://mcp.hostinger.com
codex mcp login hostinger     # otwiera przeglądarkę, logujesz się do Hostingera sam
codex mcp list                # hostinger na liście
```

Plan B (gdy OAuth hostowany nie przejdzie): lokalny serwer `codex mcp add hostinger -- npx -y
hostinger-api-mcp` (Node 24+, przy pierwszym wywołaniu też otwiera logowanie w przeglądarce).
Wariant z tokenem API (hPanel -> API) tylko przez env, nigdy w czacie:
`codex mcp add hostinger --env HOSTINGER_API_TOKEN=$HOSTINGER_API_TOKEN -- npx -y hostinger-api-mcp`.

Potem w Codexie:

```text
Przez connector Hostingera znajdź mój VPS (podam nazwę/IP), sprawdź, że ma Dockera.
Wgraj projekt radaru na serwer do ~/radar (scp albo rsync po SSH: USER@IP, port PORT; bez
node_modules, data i codex-home), a potem uruchom tam `docker compose up -d --build`.
Pokaż mi `docker compose ps` i logi z pierwszej minuty. Niczego nie usuwaj na serwerze.
```

### F4c - Wariant B: dowolny VPS przez SSH

```bash
rsync -av --exclude node_modules --exclude data --exclude codex-home -e "ssh -p PORT" ./ USER@IP:~/radar/
ssh -p PORT USER@IP "cd ~/radar && docker compose up -d --build && docker compose ps"
```

### F4d - Ściany

- Connector dobrze radzi sobie z pierwszym wdrożeniem, ale przy aktualizacjach potrafi zgłosić
  sukces, gdy pliki się nie zmieniły. Poprawki wysyłaj `rsync` (F4c) i sprawdzaj `docker compose
  logs`.
- `yt-dlp` w kontenerze starszy niż na laptopie = błędy pobierania komentarzy. W Dockerfile instaluj
  najnowszy (`pipx install yt-dlp` albo binarka z GitHub Releases), nie z `apt`.
- Docker omija `ufw`. Dlatego port bindujesz na `127.0.0.1`, a nie liczysz na firewall systemowy.
  Na Hostingerze dodatkowo firewall w panelu działa przed serwerem.

**Dodatkowo (opcja): panel bez tunelu, przez prywatną sieć Tailscale.** Jeśli serwer jest w Twoim
tailnecie, w compose daj `"TS_IP:3000:3000"` (adres `100.x.y.z` serwera) i panel otwierasz
z laptopa i telefonu bez SSH, a z internetu dalej nie istnieje. Jak to ustawić:
https://szewowsky.github.io/tailscale-vps/ (osobny poradnik, nie jest częścią tego wizardu).

**Test zaliczenia F4:** `docker compose ps` = `running`; po otwarciu tunelu (`ssh -L 3000:127.0.0.1:3000 -p PORT USER@IP`)
`curl http://127.0.0.1:3000/health` z laptopa odpowiada; z internetu (`curl http://IP:3000`,
publiczny adres) nie odpowiada; panel otwiera się w przeglądarce, ale przebieg jeszcze nie działa (silnik nie
zalogowany).

---

## F5 - Logowanie silnika na serwerze: przycisk w panelu (ok. 5 min)

Na serwerze nie ma przeglądarki, więc silnik loguje się **kodem urządzenia**. Robi to binarka
`codex` z paczki `@openai/codex`, która przyszła razem z SDK. W panelu jest do tego przycisk,
więc nie musisz wchodzić na serwer.

**Najpierw na laptopie/telefonie:** ChatGPT -> Ustawienia -> Bezpieczeństwo -> włącz
**„Device code authorization”** (w workspace Business robi to admin). Bez tego logowanie nie
przejdzie.

1. Otwórz tunel (`ssh -L 3000:127.0.0.1:3000 -p PORT USER@IP`), potem panel `http://127.0.0.1:3000` -> Ustawienia ->
   **„Zaloguj kontem ChatGPT”**.
2. Panel pokazuje link `https://auth.openai.com/codex/device` i kod w formacie `XXXX-XXXX`
   (ważny 15 minut). Otwórz link u siebie, wybierz konto, wpisz kod, potwierdź.
3. Panel odświeża status na „Zalogowano kontem ChatGPT” (w tle: `codex login status`, kod
   wyjścia 0). Wybierz model (domyślnie `gpt-6-luna`) i effort (domyślnie `high`).

Co appka robi pod spodem (tak ma to zbudować agent w F3): uruchamia
`node_modules/.bin/codex login --device-auth` z env `CODEX_HOME=/codex-home`, czyta jego wyjście,
zdejmuje kody kolorów ANSI, wyciąga link i kod, trzyma proces żywy do potwierdzenia.

**Plan B (gdy przycisk nie zadziała):**

```bash
ssh -p PORT USER@IP
cd ~/radar
docker compose exec radar npx codex login --device-auth
docker compose exec radar npx codex login status   # Logged in using ChatGPT
ls -l codex-home/                                   # auth.json, prawa 0600
```

Alternatywa (device auth wyłączony w Twoim workspace): skopiuj `~/.codex/auth.json` z laptopa do
`codex-home/` na serwerze przez `scp` i nadaj `chmod 600`. Plik = hasło do Twojego konta; nigdy
do repo, nigdy do czatu.

**Tylko Ty.** Ten przycisk loguje Twoje konto w Twojej appce. Nie udostępniasz go innym ludziom
(zasada 6). Appka dla innych = Sign in with ChatGPT: https://developers.openai.com/siwc

**Test zaliczenia F5:** panel pokazuje „Zalogowano kontem ChatGPT”; `auth.json` leży w wolumenie
`codex-home/` (przetrwa `docker compose down && up -d`).

---

## F6 - Pierwszy przebieg na serwerze i test pamięci (ok. 15 min)

1. Panel `http://127.0.0.1:3000` (przez tunel) -> dodaj 2-3 kanały -> „Przebieg”.
2. Obserwuj ślad kroków: pobranie RSS, yt-dlp per film, analiza, `turn.completed` z liczbą tokenów.
3. Raport: 3 kafelki (pytania / narzekania / luki) z pozycjami i źródłami.
4. Drugi przebieg: w śladzie ten sam `threadId`, część pozycji oznaczona „już zgłaszane”.
5. Test bezpiecznika (opcjonalnie): ustaw na chwilę `AbortSignal.timeout(20_000)` i uruchom przebieg
   na 5 kanałach; w historii ma pojawić się „przerwano”, appka ma dalej działać.
6. `docker compose restart radar` -> panel wraca, historia i logowanie zostają.

**Test zaliczenia F6:** dwa udane przebiegi, pamięć wątku widoczna, restart nie kasuje stanu.

**Zestawienie na koniec (agent pisze w czacie):**

| Co | Przed | Po |
|---|---|---|
| Klucz API OpenAI | - | nadal brak, agent na koncie ChatGPT |
| Gdzie działa | laptop | VPS, 24/7 |
| Kto widzi panel | - | tylko Ty (127.0.0.1 + tunel SSH) |
| Pamięć agenta | - | `threadId` w `data/state.json`, sesje w `codex-home/` |
| Hamulec | - | 10 min na turę |

---

## Co dalej (poza wizardem)

- Panel przez Tailscale zamiast tunelu SSH (patrz opcja w F4d).
- Cron w kontenerze (przebieg co rano) + mail/Telegram z raportem.
- Więcej źródeł: własne komentarze (co pytają Twoi widzowie), Reddit, newslettery.
- Appka dla innych ludzi: Sign in with ChatGPT (dziś open source / lokalnie, serwerowe przez listę
  oczekujących) albo klucz API z Agents API. Nigdy przez Twoje konto.

## Źródła (stan na 2026-10-06)

- Codex SDK (TypeScript): https://www.npmjs.com/package/@openai/codex-sdk (0.160.1),
  https://learn.chatgpt.com/docs/codex-sdk
- Logowanie, device auth: https://learn.chatgpt.com/docs/auth
- Sandbox i sieć: https://learn.chatgpt.com/docs/agent-approvals-security
- MCP w Codexie: https://learn.chatgpt.com/docs/extend/mcp
- Hostinger MCP: https://github.com/hostinger/api-mcp-server, serwer hostowany `https://mcp.hostinger.com`
- Skille Matta Pococka: https://github.com/mattpocock/skills
- Opcja: panel przez Tailscale zamiast tunelu: https://szewowsky.github.io/tailscale-vps/
