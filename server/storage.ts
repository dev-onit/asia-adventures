import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { races, raceDates, favourites, exploreSites } from "../shared/schema.js";
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
  // Additive columns for the venue/brand/source redesign — safe to run on every boot,
  // a no-op once already applied.
  await sql`ALTER TABLE races ADD COLUMN IF NOT EXISTS venue TEXT`;
  await sql`ALTER TABLE races ADD COLUMN IF NOT EXISTS brand TEXT`;
  await sql`ALTER TABLE races ADD COLUMN IF NOT EXISTS source TEXT`;
  await sql`ALTER TABLE races ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT now()`;
  await sql`ALTER TABLE races ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT now()`;
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
  await sql`ALTER TABLE explore_sites ADD COLUMN IF NOT EXISTS effort TEXT`;
  await sql`ALTER TABLE explore_sites ADD COLUMN IF NOT EXISTS is_paid BOOLEAN`;
  await sql`CREATE TABLE IF NOT EXISTS seed_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;
  // One row per date instance for a race — replaces the dates JSON blob going forward.
  await sql`
    CREATE TABLE IF NOT EXISTS race_dates (
      id SERIAL PRIMARY KEY,
      race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
      event_date DATE NOT NULL,
      precision TEXT NOT NULL,
      confidence TEXT NOT NULL DEFAULT 'confirmed',
      is_primary BOOLEAN NOT NULL DEFAULT true
    )
  `;
  // Favourites referencing a deleted race should clean up automatically rather than
  // leaving orphaned rows. Guarded since ADD CONSTRAINT has no IF NOT EXISTS form.
  try {
    await sql`
      ALTER TABLE favourites ADD CONSTRAINT favourites_race_id_fkey
      FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
    `;
  } catch (e: any) {
    if (e?.code !== '42710') console.warn('[migration] favourites FK constraint:', e); // 42710 = already exists
  }
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
const SEED_VERSION = "v33-venue-brand-race-dates-2026-06-28";

export async function seedIfEmpty() {
  await ensureSchema();

  // ── Badge class migration: re-derive badge_class from type+venue on every startup ─
  // Ensures badge colors are always correct regardless of seed history. "trail"/
  // "ocean-swim" are no longer separate type values — venue carries that distinction.
  try {
    await sql`
      UPDATE races SET badge_class = CASE
        WHEN type = 'triathlon' THEN 'badge-tri'
        WHEN type = 'running' AND venue = 'trail' THEN 'badge-run-trail'
        WHEN type = 'running'    THEN 'badge-run'
        WHEN type = 'swimming'   THEN 'badge-swim'
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

  if (storedVersion !== SEED_VERSION || count < 392) { // v33: venue/brand/race_dates redesign
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

  // ── Constraints for the venue/brand taxonomy — added after the reseed above so
  // existing rows already conform by the time these run. Drop+re-add each time so
  // edits to the allowed value lists take effect without a separate migration step.
  try {
    await sql`ALTER TABLE races DROP CONSTRAINT IF EXISTS races_type_check`;
    await sql`
      ALTER TABLE races ADD CONSTRAINT races_type_check
      CHECK (type IN ('running','triathlon','ocr','hyrox','xenom','swimming','swimrun'))
    `;
    await sql`ALTER TABLE races DROP CONSTRAINT IF EXISTS races_venue_check`;
    await sql`
      ALTER TABLE races ADD CONSTRAINT races_venue_check
      CHECK (
        (type IN ('running','triathlon') AND venue IN ('road','trail')) OR
        (type = 'swimming' AND venue IN ('ocean','lake','river')) OR
        (type IN ('hyrox','xenom') AND venue = 'stadium') OR
        (type = 'ocr' AND venue IN ('urban','nature')) OR
        (type = 'swimrun' AND venue IS NULL)
      )
    `;
    await sql`ALTER TABLE race_dates DROP CONSTRAINT IF EXISTS race_dates_precision_check`;
    await sql`ALTER TABLE race_dates ADD CONSTRAINT race_dates_precision_check CHECK (precision IN ('exact','month'))`;
    await sql`ALTER TABLE race_dates DROP CONSTRAINT IF EXISTS race_dates_confidence_check`;
    await sql`ALTER TABLE race_dates ADD CONSTRAINT race_dates_confidence_check CHECK (confidence IN ('confirmed','predicted'))`;
    // NULL passes a CHECK automatically — existing explore_sites rows are unresearched
    // (null) until a future backfill pass, not assumed "easy"/"free".
    await sql`ALTER TABLE explore_sites DROP CONSTRAINT IF EXISTS explore_sites_effort_check`;
    await sql`ALTER TABLE explore_sites ADD CONSTRAINT explore_sites_effort_check CHECK (effort IS NULL OR effort IN ('easy','moderate','strenuous'))`;
    console.log('[migration] type/venue/precision/confidence/effort constraints applied');
  } catch (e) { console.warn('[migration] constraint setup failed — data may not conform yet:', e); }

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
