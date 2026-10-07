// Ustawia hasło do panelu: pyta dwa razy ukrytym polem, zapisuje TYLKO hash scrypt do .env
// (w pojedynczych cudzysłowach, bo hash ma znaki $), dopisuje losowy RADAR_SESSION_SECRET, jeśli go brak.
// Użycie: node scripts/set-password.js [ścieżka/.env]
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
// Szablon z konfiguratora: samodzielny (bez importu z appki). Format hasha: scrypt$N$r$p$salt_b64$hash_b64.
import { scryptSync } from "node:crypto";

function hashPassword(password, { N = 16384, r = 8, p = 1 } = {}) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

const envPath = path.resolve(process.argv[2] ?? ".env");

function askHidden(prompt) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) return reject(new Error("Uruchom w terminalu (potrzebne ukryte pole)."));
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (ch) => {
      for (const c of ch) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          return resolve(value);
        }
        if (c === "\u0003") {
          stdin.setRawMode(false);
          stdout.write("\n");
          process.exit(130);
        }
        if (c === "\u007f" || c === "\b") value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on("data", onData);
  });
}

function setVar(lines, name, value) {
  const line = `${name}=${value}`;
  const i = lines.findIndex((l) => l.startsWith(`${name}=`));
  if (i >= 0) lines[i] = line;
  else lines.push(line);
}

const first = await askHidden("Nowe hasło do panelu (min. 8 znaków): ");
if (first.length < 8) {
  console.error("Za krótkie - minimum 8 znaków.");
  process.exit(1);
}
const second = await askHidden("Powtórz hasło: ");
if (first !== second) {
  console.error("Hasła się różnią - nic nie zapisałem.");
  process.exit(1);
}

const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8").split("\n").filter((l, i, a) => l || i < a.length - 1) : [];
setVar(lines, "RADAR_PANEL_PASSWORD_HASH", `'${hashPassword(first)}'`);
if (!lines.some((l) => /^RADAR_SESSION_SECRET=.+/.test(l))) setVar(lines, "RADAR_SESSION_SECRET", randomBytes(32).toString("hex"));
fs.writeFileSync(envPath, lines.join("\n") + "\n", { mode: 0o600 });
fs.chmodSync(envPath, 0o600);
console.log(`Zapisano hash hasła do ${envPath} (prawa 0600). Samo hasło nie zostało nigdzie zapisane.`);
