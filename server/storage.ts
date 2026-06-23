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

export async function seedIfEmpty() {
  // ── Schema version gate ──────────────────────────────────────────────
  // If the DB has fewer than 340 races, wipe races and reseed from canonical data.
  // This handles stale sandbox snapshots from old deploys.
  const count = db.select().from(races).all().length;
  // Add distance_label column if missing (migration for existing DBs)
  try {
    sqlite.exec("ALTER TABLE races ADD COLUMN distance_label TEXT NOT NULL DEFAULT ''");
    console.log('[migration] Added distance_label column');
  } catch { /* column already exists */ }

  if (count < 695) {
    console.log(`[seed] count=${count} < 690 — wiping and reseeding all races`);
    sqlite.prepare("DELETE FROM races").run();
    try { sqlite.prepare("DELETE FROM sqlite_sequence WHERE name='races'").run(); } catch {}
    const { syncAllRaces } = await import("./seed.js");
    await syncAllRaces();
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
