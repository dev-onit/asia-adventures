import { Router } from "express";
import { getRaces, getFavourites, addFavourite, removeFavourite, resetVotes, getExploreSites, getExploreFavourites, addExploreFavourite, removeExploreFavourite } from "./storage.js";
import { db } from "./storage.js";
import { races, raceDates, exploreSites } from "../shared/schema.js";
import { typeToBadge } from "./seed.js";

// Reconstructs the legacy display date string + JSON dates blob from a new-shape
// dates array, so the existing frontend (which still reads race.date/dates/status)
// keeps working for races inserted via the new import path.
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function formatLegacyDate(eventDate: string, precision: string): string {
  const [year, month, day] = eventDate.split("-").map(Number);
  const mon = MONTH_NAMES[month - 1] ?? "Jan";
  return precision === "exact" ? `${mon} ${day}, ${year}` : `${mon} ${year}`;
}
type DateEntryInput = { event_date: string; precision: string; confidence: string; is_primary?: boolean };
function buildLegacyDateFields(dateEntries: DateEntryInput[] | undefined, fallbackDate?: string, fallbackStatus?: string) {
  if (!dateEntries?.length) {
    return { date: fallbackDate ?? "", legacyDates: JSON.stringify([{ date: fallbackDate ?? "", status: fallbackStatus ?? "active" }]) };
  }
  const primary = dateEntries.find(d => d.is_primary) ?? dateEntries[0];
  const date = formatLegacyDate(primary.event_date, primary.precision);
  const legacyDates = JSON.stringify(dateEntries.map(d => ({
    date: formatLegacyDate(d.event_date, d.precision),
    status: d.confidence === "predicted" ? "watchlist" : "active",
  })));
  return { date, legacyDates };
}

// Inverse of formatLegacyDate — best-effort parse of a legacy display date string
// back into an ISO date + precision. Returns null for formats it can't confidently
// parse (e.g. "TBC 2027") rather than guessing.
function parseLegacyDate(display: string): { eventDate: string; precision: "exact" | "month" } | null {
  const monthIdx = (mon: string) => MONTH_NAMES.findIndex(m => m.toLowerCase() === mon.toLowerCase());
  let m = display.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (m) {
    const mi = monthIdx(m[1]);
    if (mi >= 0) return { eventDate: `${m[3]}-${String(mi + 1).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`, precision: "exact" };
  }
  m = display.match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (m) {
    const mi = monthIdx(m[1]);
    if (mi >= 0) return { eventDate: `${m[2]}-${String(mi + 1).padStart(2, "0")}-01`, precision: "month" };
  }
  return null;
}

// Keeps race_dates in sync whenever the legacy `dates` JSON field is written via the
// single-race POST/PUT admin endpoints (POST /admin/bulk already writes race_dates
// directly from caller-supplied dateEntries and doesn't need this). Replaces all
// existing rows for the race with ones derived from the legacy array so the two
// representations can't drift apart. Entries that fail to parse (e.g. "TBC 2027")
// are silently dropped from race_dates rather than guessing at a date.
async function syncRaceDatesFromLegacy(raceId: number, legacyDatesJson: string) {
  const { eq } = await import("drizzle-orm");
  let legacyEntries: { date: string; status?: string }[];
  try {
    legacyEntries = JSON.parse(legacyDatesJson);
  } catch {
    return;
  }
  const parsed = legacyEntries
    .map((e, i) => {
      const p = parseLegacyDate(e.date);
      if (!p) return null;
      return {
        raceId,
        eventDate: p.eventDate,
        precision: p.precision,
        confidence: e.status === "watchlist" ? "predicted" : "confirmed",
        isPrimary: i === 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  await db.delete(raceDates).where(eq(raceDates.raceId, raceId));
  if (parsed.length) await db.insert(raceDates).values(parsed);
}

const router = Router();
const ADMIN_KEY = process.env.ADMIN_KEY || "";

// Fail fast at startup if ADMIN_KEY is not configured
if (!ADMIN_KEY) {
  console.warn("[WARN] ADMIN_KEY is not set — admin routes are disabled");
}

function requireAdmin(req: any, res: any, next: any) {
  if (!ADMIN_KEY) return res.status(403).json({ error: "Admin routes disabled: ADMIN_KEY not configured" });
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
  next();
}

// ── Public routes ──

router.get("/races", async (req, res) => {
  const all = await getRaces();
  // Safety net: never return 2025 races
  res.json(all.filter((r: any) => !r.date.includes("2025")));
});

router.get("/favourites", async (req, res) => {
  res.json(await getFavourites());
});

router.post("/favourites", async (req, res) => {
  const { raceId, voterName } = req.body;
  if (!raceId || !voterName) return res.status(400).json({ error: "Missing raceId or voterName" });
  // Validate voterName: max 50 chars, no HTML tags
  const nameStr = String(voterName).trim();
  if (nameStr.length === 0 || nameStr.length > 50) return res.status(400).json({ error: "voterName must be 1–50 characters" });
  if (/<|>/.test(nameStr)) return res.status(400).json({ error: "voterName contains invalid characters" });
  res.json(await addFavourite(Number(raceId), nameStr));
});

router.delete("/favourites/:raceId", async (req, res) => {
  const { raceId } = req.params;
  const { voterName } = req.body;
  if (!voterName) return res.status(400).json({ error: "Missing voterName" });
  const nameStr = String(voterName).trim();
  if (nameStr.length === 0 || nameStr.length > 50) return res.status(400).json({ error: "voterName must be 1–50 characters" });
  await removeFavourite(Number(raceId), nameStr);
  res.json({ ok: true });
});

router.get("/explore", async (req, res) => {
  res.json(await getExploreSites());
});

router.get("/explore-favourites", async (req, res) => {
  res.json(await getExploreFavourites());
});

router.post("/explore-favourites", async (req, res) => {
  const { exploreSiteId, voterName } = req.body;
  if (!exploreSiteId || !voterName) return res.status(400).json({ error: "Missing exploreSiteId or voterName" });
  const nameStr = String(voterName).trim();
  if (nameStr.length === 0 || nameStr.length > 50) return res.status(400).json({ error: "voterName must be 1–50 characters" });
  if (/<|>/.test(nameStr)) return res.status(400).json({ error: "voterName contains invalid characters" });
  res.json(await addExploreFavourite(Number(exploreSiteId), nameStr));
});

router.delete("/explore-favourites/:exploreSiteId", async (req, res) => {
  const { exploreSiteId } = req.params;
  const { voterName } = req.body;
  if (!voterName) return res.status(400).json({ error: "Missing voterName" });
  const nameStr = String(voterName).trim();
  if (nameStr.length === 0 || nameStr.length > 50) return res.status(400).json({ error: "voterName must be 1–50 characters" });
  await removeExploreFavourite(Number(exploreSiteId), nameStr);
  res.json({ ok: true });
});

// ── Admin routes ──

router.delete("/admin/votes", requireAdmin, async (req, res) => {
  await resetVotes();
  res.json({ ok: true });
});

router.post("/admin/races", requireAdmin, async (req, res) => {
  const { name, location, country, date, distance, distanceLabel, type, venue, brand, source, team, url, note, status, badgeClass, lat, lng, dates } = req.body;
  if (!name || !location || !country || !date || !distance || !type) {
    return res.status(400).json({ error: "Missing required race fields" });
  }
  const legacyDates = dates ?? JSON.stringify([{ date, status: status ?? "active" }]);
  const result = (await db.insert(races).values({
    name, location, country, date, distance, type,
    distanceLabel: distanceLabel ?? "",
    dates: legacyDates,
    venue: venue ?? null, brand: brand ?? null, source: source ?? null,
    team: team ?? "", url: url ?? "", note: note ?? "", status: status ?? "active",
    badgeClass: badgeClass ?? typeToBadge(type, venue, name),
    lat: lat ?? null, lng: lng ?? null,
  }).returning())[0];
  if (result) await syncRaceDatesFromLegacy(result.id, legacyDates);
  res.json(result);
});

router.put("/admin/races/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  // Allowlist mutable fields — never allow id to be overwritten
  const { name, location, country, date, distance, distanceLabel, type, venue, brand, source, team, url, note, status, badgeClass, lat, lng, dates } = req.body;
  const update: Record<string, any> = {};
  if (name !== undefined) update.name = name;
  if (location !== undefined) update.location = location;
  if (country !== undefined) update.country = country;
  if (date !== undefined) update.date = date;
  if (dates !== undefined) update.dates = dates;
  if (distance !== undefined) update.distance = distance;
  if (distanceLabel !== undefined) update.distanceLabel = distanceLabel;
  if (type !== undefined) update.type = type;
  if (venue !== undefined) update.venue = venue;
  if (brand !== undefined) update.brand = brand;
  if (source !== undefined) update.source = source;
  if (team !== undefined) update.team = team;
  if (url !== undefined) update.url = url;
  if (note !== undefined) update.note = note;
  if (status !== undefined) update.status = status;
  if (badgeClass !== undefined) update.badgeClass = badgeClass;
  if (lat !== undefined) update.lat = lat;
  if (lng !== undefined) update.lng = lng;
  update.updatedAt = new Date();
  const result = (await db.update(races).set(update).where(eq(races.id, Number(id))).returning())[0];
  if (dates !== undefined && result) await syncRaceDatesFromLegacy(Number(id), dates);
  res.json(result);
});

router.delete("/admin/races/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  await db.delete(races).where(eq(races.id, Number(id)));
  res.json({ ok: true });
});

router.post("/admin/explore", requireAdmin, async (req, res) => {
  const { name, country, region, category, description, bestMonths, url, emoji, effort, isPaid, lat, lng } = req.body;
  if (!name || !country || !category || !description) {
    return res.status(400).json({ error: "Missing required explore site fields" });
  }
  const result = (await db.insert(exploreSites).values({ name, country, region: region ?? "", category, description, bestMonths: bestMonths ?? "", url: url ?? "", emoji: emoji ?? "", effort: effort ?? null, isPaid: isPaid ?? null, lat: lat ?? null, lng: lng ?? null }).returning())[0];
  res.json(result);
});

router.put("/admin/explore/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  // Allowlist mutable fields — never allow id to be overwritten
  const { name, country, region, category, description, bestMonths, url, emoji, effort, isPaid, lat, lng } = req.body;
  const update: Record<string, any> = {};
  if (name !== undefined) update.name = name;
  if (country !== undefined) update.country = country;
  if (region !== undefined) update.region = region;
  if (category !== undefined) update.category = category;
  if (description !== undefined) update.description = description;
  if (bestMonths !== undefined) update.bestMonths = bestMonths;
  if (url !== undefined) update.url = url;
  if (emoji !== undefined) update.emoji = emoji;
  if (effort !== undefined) update.effort = effort;
  if (isPaid !== undefined) update.isPaid = isPaid;
  if (lat !== undefined) update.lat = lat;
  if (lng !== undefined) update.lng = lng;
  const result = (await db.update(exploreSites).set(update).where(eq(exploreSites.id, Number(id))).returning())[0];
  res.json(result);
});

router.delete("/admin/explore/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  await db.delete(exploreSites).where(eq(exploreSites.id, Number(id)));
  res.json({ ok: true });
});

// ── Bulk insert endpoint — used by research prompts (e.g. Perplexity) to add races/
// sites directly ──
// POST /api/admin/bulk
// Body: { races?: RaceInsert[], explore?: ExploreInsert[] }
//   RaceInsert: { name, location, country, type, venue?, brand?, source?, distance,
//     distanceLabel?, team?, url?, note?, status?, lat?, lng?,
//     dates: [{ event_date, precision, confidence, is_primary }] }
// Returns: { racesAdded, sitesAdded }
// Never deletes existing data. Safe to call multiple times — duplicates skipped by name+date.
router.post("/admin/bulk", requireAdmin, async (req, res) => {
  const { races: newRaces = [], explore: newSites = [] } = req.body;
  const { eq, and } = await import("drizzle-orm");

  let racesAdded = 0;
  for (const race of newRaces) {
    if (!race.name || !race.country || !race.type) continue;
    const dateEntries: DateEntryInput[] | undefined = race.dates;
    const { date: legacyDate, legacyDates } = buildLegacyDateFields(dateEntries, race.date, race.status);
    if (!legacyDate) continue;
    // Skip if same name+date already exists
    const existing = await db.select().from(races)
      .where(and(eq(races.name, race.name), eq(races.date, legacyDate)));
    if (existing[0]) continue;
    const hasPredictedPrimary = dateEntries?.find(d => d.is_primary)?.confidence === "predicted";
    const [inserted] = await db.insert(races).values({
      name: race.name,
      location: race.location ?? "",
      country: race.country,
      date: legacyDate,
      dates: legacyDates,
      distance: race.distance ?? "",
      distanceLabel: race.distanceLabel ?? "",
      type: race.type,
      venue: race.venue ?? null,
      brand: race.brand ?? null,
      source: race.source ?? null,
      team: race.team ?? "",
      url: race.url ?? "",
      note: race.note ?? "",
      // Legacy status field stays "watchlist" when the primary date is predicted, so
      // the existing hide-unconfirmed toggle keeps working without changes.
      status: race.status ?? (hasPredictedPrimary ? "watchlist" : "active"),
      badgeClass: typeToBadge(race.type, race.venue, race.name),
      lat: race.lat ?? null,
      lng: race.lng ?? null,
    }).returning();
    if (inserted && dateEntries?.length) {
      await db.insert(raceDates).values(dateEntries.map(d => ({
        raceId: inserted.id,
        eventDate: d.event_date,
        precision: d.precision,
        confidence: d.confidence,
        isPrimary: d.is_primary ?? false,
      })));
    }
    racesAdded++;
  }

  let sitesAdded = 0;
  for (const site of newSites) {
    if (!site.name || !site.country) continue;
    // Skip if same name+country already exists
    const existing = await db.select().from(exploreSites)
      .where(and(eq(exploreSites.name, site.name), eq(exploreSites.country, site.country)));
    if (existing[0]) continue;
    await db.insert(exploreSites).values({
      name: site.name,
      country: site.country,
      region: site.region ?? "",
      category: site.category ?? "Nature",
      description: site.description ?? "",
      bestMonths: site.bestMonths ?? "",
      url: site.url ?? "",
      emoji: site.emoji ?? "",
      effort: site.effort ?? null,
      isPaid: site.isPaid ?? null,
      lat: site.lat ?? null,
      lng: site.lng ?? null,
    });
    sitesAdded++;
  }

  res.json({ ok: true, racesAdded, sitesAdded });
});

export default router;
