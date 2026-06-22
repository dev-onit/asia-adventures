import { Router } from "express";
import { getRaces, getFavourites, addFavourite, removeFavourite, resetVotes, getExploreSites } from "./storage.js";
import { db } from "./storage.js";
import { races, exploreSites } from "../shared/schema.js";

const router = Router();
const ADMIN_KEY = process.env.ADMIN_KEY || "";

function requireAdmin(req: any, res: any, next: any) {
  const key = req.headers["x-admin-key"];
  if (!ADMIN_KEY || key !== ADMIN_KEY) return res.status(403).json({ error: "Forbidden" });
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
  res.json(await addFavourite(Number(raceId), voterName));
});

router.delete("/favourites/:raceId", async (req, res) => {
  const { raceId } = req.params;
  const { voterName } = req.body;
  if (!voterName) return res.status(400).json({ error: "Missing voterName" });
  await removeFavourite(Number(raceId), voterName);
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
  const race = req.body;
  const result = db.insert(races).values(race).returning().get();
  res.json(result);
});

router.put("/admin/races/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  const result = db.update(races).set(req.body).where(eq(races.id, Number(id))).returning().get();
  res.json(result);
});

router.delete("/admin/races/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  db.delete(races).where(eq(races.id, Number(id))).run();
  res.json({ ok: true });
});

router.post("/admin/explore", requireAdmin, async (req, res) => {
  const site = req.body;
  const result = db.insert(exploreSites).values(site).returning().get();
  res.json(result);
});

router.put("/admin/explore/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  const result = db.update(exploreSites).set(req.body).where(eq(exploreSites.id, Number(id))).returning().get();
  res.json(result);
});

router.delete("/admin/explore/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { eq } = await import("drizzle-orm");
  db.delete(exploreSites).where(eq(exploreSites.id, Number(id))).run();
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
    const existing = db.select().from(races)
      .where(and(eq(races.name, race.name), eq(races.date, race.date)))
      .get();
    if (existing) continue;
    db.insert(races).values({
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
    }).run();
    racesAdded++;
  }

  let sitesAdded = 0;
  for (const site of newSites) {
    if (!site.name || !site.country) continue;
    // Skip if same name+country already exists
    const existing = db.select().from(exploreSites)
      .where(and(eq(exploreSites.name, site.name), eq(exploreSites.country, site.country)))
      .get();
    if (existing) continue;
    db.insert(exploreSites).values({
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
    }).run();
    sitesAdded++;
  }

  res.json({ ok: true, racesAdded, sitesAdded });
});

export default router;
