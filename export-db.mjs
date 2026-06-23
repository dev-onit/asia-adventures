import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let src = readFileSync(join(__dirname, "server/seedData.ts"), "utf8");

// Strip TypeScript type annotations and imports
src = src
  .replace(/^import.*\n/gm, "")
  .replace(/: RaceSeed\[\]/g, "")
  .replace(/: RaceSeed/g, "")
  .replace(/^export const races/m, "const races")
  .replace(/^export \{[^}]*\};?\s*$/gm, "");

// Append global assignment so we can grab it
src += "\nglobal.__races = races;\n";

// Write and run via eval
const tmpPath = join(__dirname, "_tmp_seed.cjs");
writeFileSync(tmpPath, src.replace(/^const races/m, "const races"));

// Use Function to eval
const fn = new Function("require", "module", "exports", "__dirname", "__filename", src);
const mod = { exports: {} };
fn(require, mod, mod.exports, __dirname, tmpPath);

const allRaces = global.__races || [];
console.log(`Total races: ${allRaces.length}`);

// Write JSON
writeFileSync(join(__dirname, "data/races.json"), JSON.stringify(allRaces, null, 2));
console.log("Written: data/races.json");

// Write CSV
const headers = ["name","location","country","date","distance","distanceLabel","type","team","url","note","status"];
const csvRows = [headers.join(",")];
for (const r of allRaces) {
  const row = headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`);
  csvRows.push(row.join(","));
}
writeFileSync(join(__dirname, "data/races.csv"), csvRows.join("\n"));
console.log("Written: data/races.csv");
