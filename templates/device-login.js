import { stripVTControlCharacters } from "node:util";

const codeToken = /\b([A-Z0-9]+-[A-Z0-9]+)\b/;

export function parseDeviceCode(output) {
  if (typeof output !== "string") return null;
  const cleanOutput = stripVTControlCharacters(output);
  const lines = cleanOutput.split(/\r?\n/);
  if (!cleanOutput.endsWith("\n")) lines.pop();
  for (let i = 0; i < lines.length; i += 1) {
    if (!/\bone[- ]time code\b/i.test(lines[i])) continue;

    let nextLine = i + 1;
    while (lines[nextLine]?.trim() === "") nextLine += 1;
    const nextLineCode = lines[nextLine]?.match(codeToken)?.[1];
    if (nextLineCode) return nextLineCode;
  }
  return null;
}
