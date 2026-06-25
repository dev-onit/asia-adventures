import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { races, favourites, exploreSites } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";

export const db = drizzle(sql);

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS races (
      id SERIAL PRIMARY KEY,
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
      dates TEXT NOT NULL DEFAULT '[]',
      lat TEXT,
      lng TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS favourites (
      id SERIAL PRIMARY KEY,
      race_id INTEGER NOT NULL,
      voter_name TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS explore_sites (
      id SERIAL PRIMARY KEY,
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
    )
  `;
  await sql`CREATE TABLE IF NOT EXISTS seed_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;
}

export async function getRaces() {
  return db.select().from(races);
}

export async function getFavourites() {
  return db.select().from(favourites);
}

export async function addFavourite(raceId: number, voterName: string) {
  const existing = await db.select().from(favourites)
    .where(and(eq(favourites.raceId, raceId), eq(favourites.voterName, voterName)));
  if (existing[0]) return existing[0];
  const inserted = await db.insert(favourites).values({ raceId, voterName }).returning();
  return inserted[0];
}

export async function removeFavourite(raceId: number, voterName: string) {
  return db.delete(favourites)
    .where(and(eq(favourites.raceId, raceId), eq(favourites.voterName, voterName)));
}

export async function resetVotes() {
  return db.delete(favourites);
}

export async function getExploreSites() {
  return db.select().from(exploreSites);
}

// Bump this whenever seedData changes — forces a full wipe+reseed on next deploy
const SEED_VERSION = "v32-halong-coords-2026-06-24";

export async function seedIfEmpty() {
  await ensureSchema();

  // ── Badge class migration: re-derive badge_class from type on every startup ─
  // Ensures badge colors are always correct regardless of seed history.
  try {
    await sql`
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
    `;
    console.log('[migration] Badge classes re-derived from type');
  } catch (e) { console.warn('[migration] Badge class migration failed:', e); }

  // ── Seed version table ─────────────────────────────────────────────────────
  const versionResult = await sql`SELECT value FROM seed_meta WHERE key = 'seed_version'`;
  const storedVersion = versionResult.rows[0]?.value ?? null;
  const countResult = await sql`SELECT COUNT(*)::int AS count FROM races`;
  const count = countResult.rows[0]?.count ?? 0;

  if (storedVersion !== SEED_VERSION || count < 392) { // v32: fix Ha Long Bay coordinates (were in Africa + Borneo)
    console.log(`[seed] version=${storedVersion} → ${SEED_VERSION}, count=${count} — wiping and reseeding all races`);
    await sql`DELETE FROM races`;
    // Also wipe votes/favourites so fresh start is truly clean
    await sql`DELETE FROM favourites`;
    // Wipe explore sites so they reseed with the new list
    await sql`DELETE FROM explore_sites`;
    const { syncAllRaces } = await import("./seed.js");
    await syncAllRaces();
    await sql`
      INSERT INTO seed_meta (key, value) VALUES ('seed_version', ${SEED_VERSION})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  } else {
    // Healthy count — just deduplicate
    await sql`
      DELETE FROM races WHERE id NOT IN (
        SELECT MIN(id) FROM races GROUP BY name
      )
    `;
  }

  const exploreCountResult = await sql`SELECT COUNT(*)::int AS count FROM explore_sites`;
  const exploreCount = exploreCountResult.rows[0]?.count ?? 0;
  if (exploreCount < 255) {
    // Reseed if count is below full expected set (e.g. sandbox was seeded with an older version)
    console.log(`[seed] explore count=${exploreCount} < 255 — reseeding explore sites`);
    await sql`DELETE FROM explore_sites`;
    const { seedExplore } = await import("./seedExplore.js");
    await seedExplore();
  }
}
