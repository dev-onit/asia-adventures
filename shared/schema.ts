import { pgTable, text, serial, integer, date, boolean, timestamp } from "drizzle-orm/pg-core";

export const races = pgTable("races", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  // `date` and `dates` (JSON: [{date, status}]) are the legacy display/date fields,
  // kept only so the existing API response stays backward-compatible during the
  // race_dates migration — see server/storage.ts. New data should go through
  // race_dates instead; these two stop being the source of truth once the app is
  // updated to read race_dates directly.
  date: text("date").notNull(),
  dates: text("dates").notNull().default("[]"),
  distance: text("distance").notNull(),
  distanceLabel: text("distance_label").notNull().default(""),
  // running | triathlon | ocr | hyrox | xenom | swimming | swimrun
  type: text("type").notNull(),
  // Meaning depends on type — see the type/venue pairing table in shared/schema docs:
  // running/triathlon: road | trail. swimming: ocean | lake | river. hyrox/xenom: stadium.
  // ocr: urban | nature. swimrun: unused (null).
  venue: text("venue"),
  // Race series/organizer brand (Spartan, Ironman, Xterra, Tough Mudder, Skyrunning, ...),
  // or null for independent/unbranded races. Deliberately free text, not an enum — new
  // brands appear over time and shouldn't require a schema change to record.
  brand: text("brand"),
  // Where this race's data was found/verified (official site, research prompt run, etc).
  source: text("source"),
  team: text("team").notNull().default(""),
  url: text("url").notNull().default(""),
  note: text("note").notNull().default(""),
  // Legacy field, kept exactly as-is for backward compatibility: active | watchlist |
  // scratched, where "watchlist" drives the existing "hide unconfirmed" toggle and red
  // triangle in the UI. race_dates.confidence is the clean version of that same concept
  // going forward — this column stops being read once the frontend is migrated to use
  // confidence directly instead of status === "watchlist".
  status: text("status").notNull().default("active"),
  badgeClass: text("badge_class").notNull().default(""),
  lat: text("lat"),
  lng: text("lng"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// One row per date instance for a race — replaces the `dates` JSON blob, which had no
// way to represent date confidence/precision without overloading `status` and was
// fragile to hand-build (a stray backslash in a date string could silently corrupt it).
export const raceDates = pgTable("race_dates", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").notNull().references(() => races.id, { onDelete: "cascade" }),
  eventDate: date("event_date").notNull(),
  // exact: the real calendar day is known. month: only month/year is known — eventDate's
  // day is a placeholder (1st of the month), not a real date to display.
  precision: text("precision").notNull(),
  // confirmed: officially announced. predicted: inferred from a prior year's pattern.
  // This is the actual "Predicted" flag shown in the UI — previously smuggled into
  // status === "watchlist" on the race or a date entry.
  confidence: text("confidence").notNull().default("confirmed"),
  // Which date to show by default when a race has more than one (e.g. this year's
  // confirmed date plus next year's predicted one).
  isPrimary: boolean("is_primary").notNull().default(true),
});

export const favourites = pgTable("favourites", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").notNull().references(() => races.id, { onDelete: "cascade" }),
  voterName: text("voter_name").notNull(),
});

export const exploreSites = pgTable("explore_sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  region: text("region").notNull().default(""),
  category: text("category").notNull(),
  description: text("description").notNull(),
  bestMonths: text("best_months").notNull().default(""),
  url: text("url").notNull().default(""),
  emoji: text("emoji").notNull().default(""),
  // easy | moderate | strenuous — physical effort to visit (mainly relevant for
  // Mountains/Nature). Nullable: existing sites need a research pass to fill this in.
  effort: text("effort"),
  // Whether entry costs money. Nullable — unset means not yet researched, not "free".
  isPaid: boolean("is_paid"),
  lat: text("lat"),
  lng: text("lng"),
});

// Mirrors `favourites` rather than sharing one polymorphic table — a single column
// can't cleanly FK to two different tables with real referential integrity, and we'd
// lose the ON DELETE CASCADE safety net. Two small tables beats one fragile one.
export const exploreFavourites = pgTable("explore_favourites", {
  id: serial("id").primaryKey(),
  exploreSiteId: integer("explore_site_id").notNull().references(() => exploreSites.id, { onDelete: "cascade" }),
  voterName: text("voter_name").notNull(),
});

export type Race = typeof races.$inferSelect;
export type RaceDate = typeof raceDates.$inferSelect;
export type Favourite = typeof favourites.$inferSelect;
export type ExploreSite = typeof exploreSites.$inferSelect;
export type ExploreFavourite = typeof exploreFavourites.$inferSelect;
