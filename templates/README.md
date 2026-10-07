# templates/ - gotowe fragmenty kodu appki

- `device-login.js` - parser jednorazowego kodu z wyjścia `codex login --device-auth`: zdejmuje kody
  ANSI, bierze kod z linii po „one-time code”, segmenty różnej długości (`J7SZ-MXKP1`, `AB12-CD34`).
- `device-login.test.js` - test parsera na realnym wyjściu CLI; uruchom: `node templates/device-login.test.js`.

Agent kopiuje oba pliki do appki w F3 (ticket z logowaniem ChatGPT), poprawia ścieżkę importu
w teście i dołącza go do `npm test`. Parsera nie pisze od nowa (ściana F3d / F5 w `WIZARD.md`).
- `set-password.js` - ustawia hasło do panelu z terminala: pyta dwa razy ukrytym polem, zapisuje tylko
  hash scrypt do `.env` (w pojedynczych cudzysłowach, 0600) i dopisuje losowy `RADAR_SESSION_SECRET`.
  Agent kopiuje go do `scripts/set-password.js` appki; hasło nigdy nie przechodzi przez czat.
