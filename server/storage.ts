import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { races, favourites, exploreSites } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";
import path from "path";

// Works in both ESM (import.meta.url) and CJS (__dirname via esbuild injection)
const dbPath = path.resolve(process.cwd(), "data.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    country TEXT NOT NULL,
    date TEXT NOT NULL,
    distance TEXT NOT NULL,
    distance_label TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL,
    team TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    badge_class TEXT NOT NULL DEFAULT '',
    lat TEXT,
    lng TEXT
  );
  CREATE TABLE IF NOT EXISTS favourites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    voter_name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS explore_sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    best_months TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    emoji TEXT NOT NULL DEFAULT '',
    lat TEXT,
    lng TEXT
  );
`);

export async function getRaces() {
  return db.select().from(races).all();
}

export async function getFavourites() {
  return db.select().from(favourites).all();
}

export async function addFavourite(raceId: number, voterName: string) {
  const existing = db.select().from(favourites)
    .where(and(eq(favourites.raceId, raceId), eq(favourites.voterName, voterName)))
    .get();
  if (existing) return existing;
  return db.insert(favourites).values({ raceId, voterName }).returning().get();
}

export async function removeFavourite(raceId: number, voterName: string) {
  return db.delete(favourites)
    .where(and(eq(favourites.raceId, raceId), eq(favourites.voterName, voterName)))
    .run();
}

export async function resetVotes() {
  return db.delete(favourites).run();
}

export async function getExploreSites() {
  return db.select().from(exploreSites).all();
}

// Bump this whenever seedData changes — forces a full wipe+reseed on next deploy
const SEED_VERSION = "v16-myoko-trail-2026-06-23";

export async function seedIfEmpty() {
  // ── Migrations FIRST — must run before any drizzle SELECT uses the schema ──
  try {
    sqlite.exec("ALTER TABLE races ADD COLUMN distance_label TEXT NOT NULL DEFAULT ''");
    console.log('[migration] Added distance_label column');
  } catch { /* column already exists */ }
  try {
    sqlite.exec("ALTER TABLE races ADD COLUMN dates TEXT NOT NULL DEFAULT '[]'");
    console.log('[migration] Added dates column');
  } catch { /* column already exists */ }
  // ── Badge class migration: re-derive badge_class from type on every startup ─
  // Ensures badge colors are always correct regardless of seed history.
  try {
    sqlite.exec(`
      UPDATE races SET badge_class = CASE
        WHEN type = 'triathlon'  THEN 'badge-tri'
        WHEN type = 'trail'      THEN 'badge-run-trail'
        WHEN type = 'running'    THEN 'badge-run'
        WHEN type = 'ocean-swim' THEN 'badge-swim'
        WHEN type = 'swimrun'    THEN 'badge-swimrun'
        WHEN type = 'hyrox'      THEN 'badge-hyrox'
        WHEN type = 'ocr' AND (LOWER(name) LIKE '%spartan%' OR LOWER(name) LIKE '%deka%') THEN 'badge-spartan'
        WHEN type = 'ocr'        THEN 'badge-ocr'
        WHEN type = 'xenom'      THEN 'badge-xenom'
        ELSE badge_class
      END
    `);
    console.log('[migration] Badge classes re-derived from type');
  } catch (e) { console.warn('[migration] Badge class migration failed:', e); }
  // ── Seed version table ─────────────────────────────────────────────────────
  sqlite.exec(`CREATE TABLE IF NOT EXISTS seed_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  const storedVersion = (sqlite.prepare("SELECT value FROM seed_meta WHERE key='seed_version'").get() as any)?.value ?? null;
  // ── Now safe to query via drizzle ──────────────────────────────────────────
  const count = db.select().from(races).all().length;

  if (storedVersion !== SEED_VERSION || count < 482) {
    console.log(`[seed] version=${storedVersion} → ${SEED_VERSION}, count=${count} — wiping and reseeding all races`);
    sqlite.prepare("DELETE FROM races").run();
    try { sqlite.prepare("DELETE FROM sqlite_sequence WHERE name='races'").run(); } catch {}
    const { syncAllRaces } = await import("./seed.js");
    await syncAllRaces();
    sqlite.prepare("INSERT OR REPLACE INTO seed_meta (key, value) VALUES ('seed_version', ?)").run(SEED_VERSION);
  } else {
    // Healthy count — just deduplicate
    sqlite.prepare(`
      DELETE FROM races WHERE id NOT IN (
        SELECT MIN(id) FROM races GROUP BY name
      )
    `).run();
  }

  const exploreCount = db.select().from(exploreSites).all().length;
  if (exploreCount === 0) {
    const { seedExplore } = await import("./seedExplore.js");
    await seedExplore();
  }
}
