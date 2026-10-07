import assert from "node:assert/strict";
import { parseDeviceCode } from "./device-login.js";

// Realne wyjście `codex login --device-auth` (07.10.2026): kod w linii po „one-time code”, segmenty 4-5.
const realCliOutput = [
  "1. Open this link in your browser and sign in to your account",
  "   https://auth.openai.com/codex/device",
  "",
  "2. Enter this one-time code (expires in 15 minutes)",
  "   J7SZ-MXKP1",
  "",
].join("\n");
assert.equal(parseDeviceCode(realCliOutput), "J7SZ-MXKP1");

// To samo z kodami ANSI i kodem rozciętym między dwa fragmenty strumienia.
const splitAnsiOutput = [
  "\u001b[32mOpen https://auth.openai.com/codex/device and enter this one-time code:\u001b[0m\n\nJ7SZ-M",
  "XKP1\n",
].join("");
assert.equal(parseDeviceCode(splitAnsiOutput), "J7SZ-MXKP1");

// Kod 4-4 i inne długości segmentów.
assert.equal(parseDeviceCode("2. Enter this one-time code (expires in 15 minutes)\n   AB12-CD34\n"), "AB12-CD34");
assert.equal(parseDeviceCode("Use this one-time code:\nAB12-CD34\n"), "AB12-CD34");
assert.equal(parseDeviceCode("Use this one-time code:\nABC-123456\n"), "ABC-123456");

// Niepełna linia (strumień jeszcze nie skończył kodu) = jeszcze brak wyniku.
assert.equal(parseDeviceCode("Use this one-time code:\n\nABC-123"), null);
assert.equal(parseDeviceCode("Use this one-time code:\n\nABC-123" + "456\n"), "ABC-123456");

// Bez fałszywych trafień w nagłówkach i linkach.
assert.equal(parseDeviceCode("Codex login --device-auth\nhttps://auth.openai.com/codex/device\n"), null);
assert.equal(parseDeviceCode("one-time code:\nOpen the device-auth page\n"), null);
assert.equal(parseDeviceCode(undefined), null);

console.log("PASS device login parser: realne wyjście CLI (4-5), ANSI, kod rozcięty, 4-4, bez fałszywych trafień");
