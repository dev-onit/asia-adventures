import { Router } from "express";
import { getRaces, getFavourites, addFavourite, removeFavourite, resetVotes, getExploreSites } from "./storage.js";
import { db } from "./storage.js";
import { races, exploreSites } from "../shared/schema.js";

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

// ── Admin routes ──

router.delete("/admin/votes", requireAdmin, async (req, res) => {
  await resetVotes();
  res.json({ ok: true });
});

router.post("/admin/races", requireAdmin, async (req, res) => {
  const { name, location, country, date, distance, type, team, url, note, status, badgeClass, lat, lng } = req.body;
  if (!name || !location || !country || !date || !distance || !type) {
    return res.status(400).json({ error: "Missing required race fields" });
  }
  const result = (await db.insert(races).values({ name, location, country, date, distance, type, team: team ?? "", url: url ?? "", note: note ?? "", status: status ?? "active", badgeClass: badgeClass ?? "", lat: lat ?? null, lng: lng ?? null }).returning())[0];
  res.json(result);
});

router.put("/admin/races/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  // Allowlist mutable fields — never allow id to be overwritten
  const { name, location, country, date, distance, type, team, url, note, status, badgeClass, lat, lng, dates } = req.body;
  const update: Record<string, any> = {};
  if (name !== undefined) update.name = name;
  if (location !== undefined) update.location = location;
  if (country !== undefined) update.country = country;
  if (date !== undefined) update.date = date;
  if (dates !== undefined) update.dates = dates;
  if (distance !== undefined) update.distance = distance;
  if (type !== undefined) update.type = type;
  if (team !== undefined) update.team = team;
  if (url !== undefined) update.url = url;
  if (note !== undefined) update.note = note;
  if (status !== undefined) update.status = status;
  if (badgeClass !== undefined) update.badgeClass = badgeClass;
  if (lat !== undefined) update.lat = lat;
  if (lng !== undefined) update.lng = lng;
  const result = (await db.update(races).set(update).where(eq(races.id, Number(id))).returning())[0];
  res.json(result);
});

router.delete("/admin/races/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  await db.delete(races).where(eq(races.id, Number(id)));
  res.json({ ok: true });
});

router.post("/admin/explore", requireAdmin, async (req, res) => {
  const { name, country, region, category, description, bestMonths, url, emoji, lat, lng } = req.body;
  if (!name || !country || !category || !description) {
    return res.status(400).json({ error: "Missing required explore site fields" });
  }
  const result = (await db.insert(exploreSites).values({ name, country, region: region ?? "", category, description, bestMonths: bestMonths ?? "", url: url ?? "", emoji: emoji ?? "", lat: lat ?? null, lng: lng ?? null }).returning())[0];
  res.json(result);
});

router.put("/admin/explore/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  // Allowlist mutable fields — never allow id to be overwritten
  const { name, country, region, category, description, bestMonths, url, emoji, lat, lng } = req.body;
  const update: Record<string, any> = {};
  if (name !== undefined) update.name = name;
  if (country !== undefined) update.country = country;
  if (region !== undefined) update.region = region;
  if (category !== undefined) update.category = category;
  if (description !== undefined) update.description = description;
  if (bestMonths !== undefined) update.bestMonths = bestMonths;
  if (url !== undefined) update.url = url;
  if (emoji !== undefined) update.emoji = emoji;
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

// ── Bulk insert endpoint — used by Perplexity to add races/sites directly ──
// POST /api/admin/bulk
// Body: { races?: RaceInsert[], explore?: ExploreInsert[] }
// Returns: { racesAdded, sitesAdded }
// Never deletes existing data. Safe to call multiple times — duplicates skipped by name+date.
router.post("/admin/bulk", requireAdmin, async (req, res) => {
  const { races: newRaces = [], explore: newSites = [] } = req.body;
  const { eq, and } = await import("drizzle-orm");

  let racesAdded = 0;
  for (const race of newRaces) {
    if (!race.name || !race.date || !race.country) continue;
    // Skip if same name+date already exists
    const existing = await db.select().from(races)
      .where(and(eq(races.name, race.name), eq(races.date, race.date)));
    if (existing[0]) continue;
    await db.insert(races).values({
      name: race.name,
      location: race.location ?? "",
      country: race.country,
      date: race.date,
      distance: race.distance ?? "",
      type: race.type ?? "running",
      team: race.team ?? "",
      url: race.url ?? "",
      note: race.note ?? "",
      status: race.status ?? "active",
      badgeClass: race.badgeClass ?? `badge-${(race.type ?? "run").slice(0, 3)}`,
      lat: race.lat ?? null,
      lng: race.lng ?? null,
    });
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
      lat: site.lat ?? null,
      lng: site.lng ?? null,
    });
    sitesAdded++;
  }

  res.json({ ok: true, racesAdded, sitesAdded });
});

export default router;
