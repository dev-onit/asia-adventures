import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Maximize2, Minimize2, Filter, X, Star, TrendingUp, Sun, Moon, Layers, Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Race, ExploreSite } from "../../../shared/schema";
import { getCoords, COUNTRY_WEATHER } from "../lib/raceGeo";
import { getRaceWeather } from "../lib/weatherData";

interface Props {
  races: Race[];
  allRaces: Race[];
  sites: ExploreSite[];
  favSet: Set<number>;
  voterName: string;
  votesByRace: Map<number, string[]>;
  exploreVotesBySite: Map<number, string[]>;
  showFavsOnly: boolean;
  countryFilters: string[];
  onToggleFav: (raceId: number, isFav: boolean) => void;
  isDark: boolean;
  hidePast: boolean;
  onToggleHidePast: () => void;
  showUnconfirmed: boolean;
  onToggleUnconfirmed: () => void;
  recenterRef?: MutableRefObject<(() => void) | null>;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showFilterBar: boolean;
  onToggleFilterBar: () => void;
  activeFilterCount: number;
  onClearAllFilters: () => void;
  onToggleFavs: () => void;
  sortMode: "date" | "votes";
  onToggleMostVoted: () => void;
  onToggleTheme: () => void;
  showSearch: boolean;
  onToggleSearch: () => void;
}

// Running (road) and Trail share the "RUN" pin label but get distinct colors
// so they're still visually distinguishable on the map at a glance.
const TYPE_COLORS: Record<string, string> = {
  running:      "#8b5cf6", // Road running — violet
  trail:        "#f97316", // Trail running — orange
  triathlon:    "#0ea5e9",
  hyrox:        "#facc15",
  "ocean-swim": "#06b6d4",
  swimrun:      "#14b8a6",
  ocr:          "#ef4444",
  xenom:        "#a855f7",
};

const TYPE_LETTERS: Record<string, string> = {
  running:      "RUN",
  trail:        "RUN",
  triathlon:    "TRI",
  hyrox:        "HYR",
  "ocean-swim": "SWIM",
  swimrun:      "SWR",
  ocr:          "OCR",
  xenom:        "XEN",
};

const TYPE_LABELS: Record<string, string> = {
  running: "Running", triathlon: "Triathlon", trail: "Running",
  hyrox: "Hyrox", "ocean-swim": "Swimming", swimrun: "SwimRun",
  ocr: "OCR", xenom: "Xenom",
};

// Popup badge sub-label — shown dimmed next to the main pill, e.g. "Running · Trail",
// to distinguish Road vs Trail without splitting them into separate sport labels.
const TYPE_SUBLABELS: Record<string, string> = {
  running: "Road", trail: "Trail",
};

// The maps above key on the pre-venue taxonomy (separate "trail"/"ocean-swim" type
// values). The database now stores "running"+venue:"trail" and "swimming"+venue:"ocean"
// instead — this derives the old key so colors/labels/letters stay identical without
// duplicating every map above.
function legacyTypeKey(race: { type: string; venue?: string | null }): string {
  if (race.type === "running" && race.venue === "trail") return "trail";
  if (race.type === "swimming") return "ocean-swim";
  return race.type;
}

// Explore categories deliberately avoid any color used by TYPE_COLORS (Races) above —
// e.g. Mountains used to share Trail's orange, Islands shared Ocean-Swim's cyan, and
// Cities shared Road-running's violet, making the two map layers indistinguishable
// when both are visible. Leaning green/earth-toned reinforces "Explore = the green layer".
const CATEGORY_COLORS: Record<string, string> = {
  Mountains: "#16a34a", Islands: "#0d9488", Cities: "#84cc16",
  Temples: "#f59e0b", Nature: "#22c55e", Beaches: "#ec4899",
};

const CARD_DARK = "#1b1f27";
const BADGE_PAD = 14;

// ── Sport pill SVG (individual pin) ──
function sportPillSvg(fill: string, label: string, w: number, h: number): string {
  const rx = h / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block">
    <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" ry="${rx}" fill="${CARD_DARK}"/>
    <rect x="2" y="2" width="${w-4}" height="${h-4}" rx="${rx-2}" ry="${rx-2}" fill="${fill}" fill-opacity="0.22" stroke="${fill}" stroke-width="1"/>
    <text x="${w/2}" y="${h/2+3.6}" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" font-weight="800" letter-spacing="0.8"
      fill="${fill}" paint-order="stroke" stroke="${CARD_DARK}" stroke-width="2.5" stroke-linejoin="round">${label}</text>
  </svg>`;
}

// ── Explore text pill SVG ──
function explorePillSvg(label: string, color: string): string {
  const ph = 10, pv = 5, fontSize = 9, charW = fontSize * 0.65;
  const w = Math.round(label.length * charW + ph * 2);
  const h = fontSize + pv * 2;
  const rx = h / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block">
    <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" ry="${rx}" fill="${CARD_DARK}"/>
    <rect x="1.5" y="1.5" width="${w-3}" height="${h-3}" rx="${rx-1.5}" ry="${rx-1.5}" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="1"/>
    <text x="${w/2}" y="${h/2+3.2}" text-anchor="middle" font-size="${fontSize}" font-family="system-ui,sans-serif" font-weight="700" letter-spacing="0.5"
      fill="${color}" paint-order="stroke" stroke="${CARD_DARK}" stroke-width="2" stroke-linejoin="round">${label}</text>
  </svg>`;
}

// ── Race icon HTML (pill + badges) ──
function raceIconHtml(fill: string, label: string, isFav: boolean, voteCount: number, pillW: number, pillH: number): string {
  const totalW = pillW + BADGE_PAD * 2;
  const totalH = pillH + BADGE_PAD * 2;
  const starHtml = isFav
    ? `<div style="position:absolute;top:${BADGE_PAD-7}px;right:${BADGE_PAD-7}px;width:14px;height:14px;background:#facc15;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;line-height:1;color:#000;font-weight:900;pointer-events:none;box-shadow:0 0 5px rgba(250,204,21,0.8),0 1px 2px rgba(0,0,0,0.4);z-index:20">★</div>`
    : "";
  const voteHtml = voteCount > 0
    ? `<div style="position:absolute;bottom:${BADGE_PAD-7}px;right:${BADGE_PAD-7}px;min-width:14px;height:14px;background:#fb923c;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:#000;line-height:1;padding:0 3px;pointer-events:none;box-shadow:0 0 5px rgba(251,146,60,0.8),0 1px 2px rgba(0,0,0,0.4);z-index:20">${voteCount}</div>`
    : "";
  return `<div style="position:relative;width:${totalW}px;height:${totalH}px;overflow:visible">
    <div style="position:absolute;top:${BADGE_PAD}px;left:${BADGE_PAD}px">${sportPillSvg(fill, label, pillW, pillH)}</div>
    ${starHtml}${voteHtml}
  </div>`;
}

function buildRaceIcon(fill: string, label: string, isFav: boolean, voteCount: number): L.DivIcon {
  const ph = 11, pv = 6, fontSize = 10, charW = fontSize * 0.62;
  const pillW = Math.round(label.length * charW + ph * 2);
  const pillH = fontSize + pv * 2;
  const totalW = pillW + BADGE_PAD * 2;
  const totalH = pillH + BADGE_PAD * 2;
  return L.divIcon({
    html: raceIconHtml(fill, label, isFav, voteCount, pillW, pillH),
    className: "",
    iconSize: [totalW, totalH],
    iconAnchor: [totalW / 2, totalH / 2],
    popupAnchor: [0, -(totalH / 2 + 8)],
  });
}

function buildExploreIcon(label: string, color: string): L.DivIcon {
  const ph = 10, pv = 5, fontSize = 9, charW = fontSize * 0.65;
  const pillW = Math.round(label.length * charW + ph * 2);
  const pillH = fontSize + pv * 2;
  const totalW = pillW + BADGE_PAD * 2;
  const totalH = pillH + BADGE_PAD * 2;
  const html = `<div style="position:relative;width:${totalW}px;height:${totalH}px;overflow:visible">
    <div style="position:absolute;top:${BADGE_PAD}px;left:${BADGE_PAD}px">${explorePillSvg(label, color)}</div>
  </div>`;
  return L.divIcon({ html, className: "", iconSize: [totalW, totalH], iconAnchor: [totalW / 2, totalH / 2], popupAnchor: [0, -(totalH / 2 + 6)] });
}

// ── Cluster icon — bold, solid, Apple Maps-style circle with a count ──
function makeClusterIconFn(baseColor: string) {
  return (cluster: { getChildCount: () => number }): L.DivIcon => {
    const count = cluster.getChildCount();
    const r = count <= 4 ? 17 : count <= 9 ? 21 : count <= 20 ? 24 : count <= 40 ? 28 : 31;
    const size = r * 2;
    const fs = r <= 17 ? 12 : r <= 21 ? 13 : r <= 24 ? 14 : 15;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${r}" cy="${r}" r="${r}" fill="#1b1f27"/>
      <circle cx="${r}" cy="${r}" r="${r - 2.5}" fill="${baseColor}" fill-opacity="0.55" stroke="${baseColor}" stroke-width="2"/>
      <text x="${r}" y="${r}" text-anchor="middle" dominant-baseline="central" font-size="${fs}" font-family="system-ui,sans-serif" font-weight="900" letter-spacing="-0.5" fill="white" paint-order="stroke" stroke="#1b1f27" stroke-width="2.5" stroke-linejoin="round">${count}</text>
    </svg>`;
    return L.divIcon({ html: svg, className: "", iconSize: [size, size], iconAnchor: [r, r] });
  };
}
const raceClusterIcon = makeClusterIconFn("#3b82f6");
const exploreClusterIcon = makeClusterIconFn("#22c55e");

// ── Spread pins that share a map location ──
// Only ever called on the final "solo" set (markers small-enough-to-show-individually,
// decided separately by groupByPixelDistance below) — never on the full dataset. That
// matters: grouping by screen-pixel proximity is the right test here ("would these two
// icons visually collide right now"), but feeding pixel-distorted positions back into the
// cluster-bundling decision is what caused a regression earlier (it made far-apart races
// look close enough at low zoom to break large clusters into scattered individual pins).
// Keeping this pass downstream of that decision avoids the feedback loop entirely.
type GeoPoint = { id: string; lat: number; lng: number };

// Single source of truth for cluster-bundling radii — previously duplicated as bare
// 60/50 literals in both groupByPixelDistance's solo-pin decision and the matching
// MarkerClusterGroup's maxClusterRadius prop, with no link between the two, so the
// "groups this small render as individual pins" boundary and the "groups this size
// actually get bundled into one cluster bubble" boundary could silently drift apart
// if only one of the two literals was ever changed.
const RACE_CLUSTER_RADIUS_PX = 60;
const EXPLORE_CLUSTER_RADIUS_PX = 50;
// Groups at or below this size render as individual pins instead of a cluster bubble.
const SOLO_GROUP_MAX_SIZE = 4;

function spreadOverlappingPoints(map: L.Map, points: GeoPoint[]): Map<string, [number, number]> {
  // Must be >= the largest cluster-bundling radius below — otherwise two points just
  // outside this radius but still inside the bundling radius can both get marked
  // "solo" without ever being grouped here, and render solo-but-still-overlapping.
  const SPREAD_GROUP_PX = Math.max(RACE_CLUSTER_RADIUS_PX, EXPLORE_CLUSTER_RADIUS_PX);
  const groups = groupByPixelDistance(map, points, SPREAD_GROUP_PX);

  const zoom = map.getZoom();
  const result = new Map<string, [number, number]>();
  groups.forEach(group => {
    if (group.length === 1) {
      result.set(group[0].id, [group[0].lat, group[0].lng]);
      return;
    }
    const projected = group.map(p => map.project([p.lat, p.lng], zoom));
    const center = projected.reduce((acc, pt) => acc.add(pt), L.point(0, 0)).divideBy(group.length);
    const radius = Math.max(40, group.length * 18);
    group.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / group.length;
      const pt = L.point(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle));
      const latlng = map.unproject(pt, zoom);
      result.set(p.id, [latlng.lat, latlng.lng]);
    });
  });
  return result;
}

// ── Group points by on-screen proximity so we can tell which clusters are "small enough
// to just show as pins". Greedy single-link grouping using the same radius the visual
// cluster group uses, projected at the current zoom so it stays stable while panning.
function groupByPixelDistance(map: L.Map, points: GeoPoint[], radius: number): GeoPoint[][] {
  const zoom = map.getZoom();
  const projected = points.map(p => ({ p, pt: map.project([p.lat, p.lng], zoom) }));
  const groups: { p: GeoPoint; pt: L.Point }[][] = [];
  projected.forEach(item => {
    const group = groups.find(g => g.some(o => o.pt.distanceTo(item.pt) <= radius));
    if (group) group.push(item); else groups.push([item]);
  });
  return groups.map(g => g.map(x => x.p));
}

const POPUP_STYLE = `
  .map-popup {
    font-family: 'Satoshi', system-ui, sans-serif;
    min-width: 210px; max-width: 270px;
    background: hsl(var(--card)); color: hsl(var(--card-foreground));
    border: 1px solid hsl(var(--border)); border-radius: 14px;
    padding: 14px; box-shadow: 0 6px 24px rgba(0,0,0,0.22);
  }
  .map-popup .mp-badge {
    display: inline-block; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    padding: 2px 8px; border-radius: 999px; margin-bottom: 8px;
  }
  .map-popup .mp-name { font-size: 14px; font-weight: 700; line-height: 1.3; margin-bottom: 6px; color: hsl(var(--card-foreground)); }
  .map-popup .mp-row { font-size: 11px; color: hsl(var(--muted-foreground)); margin-bottom: 3px; display: flex; align-items: center; gap: 5px; }
  .map-popup .mp-months { font-size: 11px; font-weight: 600; color: hsl(var(--primary)); margin-top: 6px; }
  .map-popup .mp-actions { display: flex; gap: 8px; margin-top: 10px; align-items: stretch; }
  .map-popup .mp-star-btn {
    padding: 7px 12px; border-radius: 8px;
    border: 1px solid hsl(var(--border)); background: hsl(var(--muted));
    color: hsl(var(--muted-foreground)); font-size: 12px; font-weight: 600;
    cursor: pointer; text-align: center; white-space: nowrap;
  }
  .map-popup .mp-star-btn.starred { background: hsl(45 85% 50% / 0.15); border-color: #facc15; color: #ca8a04; }
  .map-popup .mp-visit-btn {
    flex: 1; padding: 7px 14px; border-radius: 8px;
    border: 1px solid hsl(var(--primary) / 0.6); background: hsl(var(--primary) / 0.15);
    color: hsl(var(--primary)); font-size: 12px; font-weight: 700;
    cursor: pointer; text-align: center; text-decoration: none; display: block;
  }
  .map-popup .mp-visit-btn:hover { background: hsl(var(--primary) / 0.25); }
  .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; border-radius: 14px !important; padding: 0 !important; }
  .leaflet-popup-content { margin: 0 !important; }
  .leaflet-popup-tip-container { display: none !important; }
  .leaflet-popup-close-button { color: hsl(var(--muted-foreground)) !important; font-size: 20px !important; width: 28px !important; height: 28px !important; top: 6px !important; right: 6px !important; }
  .leaflet-bar {
    display: flex !important; flex-direction: column !important;
    gap: 4px !important; border: none !important; border-radius: 0 !important;
    background: transparent !important; box-shadow: none !important;
  }
  .leaflet-bar a,
  .leaflet-control-zoom-in,
  .leaflet-control-zoom-out {
    width: 36px !important; height: 36px !important;
    line-height: 36px !important; font-size: 20px !important; font-weight: 400 !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    text-align: center !important; text-indent: 0 !important;
    padding: 0 !important; margin: 0 !important;
    border-radius: 8px !important; border: 1px solid !important;
    background: rgba(24,24,27,0.95) !important;
    border-color: rgb(63,63,70) !important;
    color: rgb(212,212,216) !important;
    box-shadow: 0 1px 4px rgba(0,0,0,0.18) !important;
    float: none !important;
  }
  .leaflet-bar a:hover,
  .leaflet-control-zoom-in:hover,
  .leaflet-control-zoom-out:hover { filter: brightness(0.92) !important; }
  .light .leaflet-bar a,
  .light .leaflet-control-zoom-in,
  .light .leaflet-control-zoom-out {
    background: rgba(255,255,255,0.95) !important;
    border-color: rgb(212,212,216) !important;
    color: rgb(82,82,91) !important;
  }
  /* Smaller on desktop, where the bigger touch-target sizing isn't needed —
     matches the floating React buttons' own sm: breakpoint downsizing. */
  @media (min-width: 640px) {
    .leaflet-bar a,
    .leaflet-control-zoom-in,
    .leaflet-control-zoom-out {
      width: 32px !important; height: 32px !important;
      line-height: 32px !important; font-size: 18px !important;
    }
  }
  /* Fullscreen only: this container's own bottom edge is the literal physical
     screen edge (under viewport-fit=cover), so the native zoom control needs the
     same safe-area-inset-bottom clearance as the React button clusters get,
     otherwise it sits right at the home-indicator strip. */
  .map-fullscreen.leaflet-container .leaflet-bottom {
    bottom: env(safe-area-inset-bottom, 0px) !important;
  }
`;

// ── Popup content (real React components — no HTML strings, no manual DOM wiring) ──
function RacePopupContent({ race, isFav, voters, onToggleFav }: {
  race: Race; isFav: boolean; voters: string[]; onToggleFav: Props["onToggleFav"];
}) {
  const legacyType = legacyTypeKey(race);
  const fill = TYPE_COLORS[legacyType] ?? "#6366f1";
  const label = TYPE_LABELS[legacyType] ?? race.type;
  const subLabel = TYPE_SUBLABELS[legacyType];
  const flag = COUNTRY_WEATHER[race.country]?.flag ?? "";
  const weather = getRaceWeather(race.location, race.date);
  const showWaterTemp = weather?.waterTemp != null && ["triathlon", "swimming", "swimrun"].includes(race.type);

  return (
    <div className="map-popup">
      <span className="mp-badge" style={{ background: `${fill}22`, color: fill, border: `1px solid ${fill}55` }}>
        {label}{subLabel && <span style={{ opacity: 0.65, fontWeight: 500 }}> · {subLabel}</span>}
      </span>
      <div className="mp-name">{race.name}</div>
      <div className="mp-row">📍 {race.location}, {flag} {race.country}</div>
      <div className="mp-row">📅 {race.date} · {race.distance}</div>
      {voters.length > 0 && <div className="mp-row">👥 {voters.join(", ")}</div>}
      {weather && (
        <div className="mp-row">
          🌡️ {weather.temp}°C · {weather.condition}
          {showWaterTemp && weather.waterTemp != null && <span style={{ marginLeft: 4 }}>🌊 {weather.waterTemp}°C</span>}
        </div>
      )}
      <div className="mp-actions">
        <button className={`mp-star-btn ${isFav ? "starred" : ""}`} onClick={() => onToggleFav(race.id, isFav)}>
          {isFav ? "★ Starred" : "☆ Star"}
        </button>
        {race.url && <a href={race.url} target="_blank" rel="noopener noreferrer" className="mp-visit-btn">↗ Visit</a>}
      </div>
    </div>
  );
}

function ExplorePopupContent({ site, voters }: { site: ExploreSite; voters: string[] }) {
  const color = CATEGORY_COLORS[site.category] ?? "#94a3b8";
  const flag = COUNTRY_WEATHER[site.country]?.flag ?? "";
  const desc = site.description.length > 120 ? site.description.slice(0, 120) + "…" : site.description;
  return (
    <div className="map-popup">
      <span className="mp-badge" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>{site.category}</span>
      <div className="mp-name">{site.name}</div>
      <div className="mp-row">{flag} {site.country}{site.region ? <> · {site.region}</> : null}</div>
      <div className="mp-row" style={{ marginTop: 4, lineHeight: 1.5 }}>{desc}</div>
      {voters.length > 0 && <div className="mp-row">👥 {voters.join(", ")}</div>}
      {site.bestMonths && <div className="mp-months">Best: {site.bestMonths}</div>}
      {site.url && (
        <a href={site.url} target="_blank" rel="noopener noreferrer" className="mp-visit-btn" style={{ marginTop: 10, display: "block", textAlign: "center" }}>
          ↗ Visit
        </a>
      )}
    </div>
  );
}

// ── Markers ──
function RaceMarker({ race, coords, isFav, voters, onToggleFav }: {
  race: Race; coords: [number, number]; isFav: boolean; voters: string[]; onToggleFav: Props["onToggleFav"];
}) {
  const legacyType = legacyTypeKey(race);
  const fill = TYPE_COLORS[legacyType] ?? "#6366f1";
  const label = TYPE_LETTERS[legacyType] ?? "?";
  const icon = useMemo(() => buildRaceIcon(fill, label, isFav, voters.length), [fill, label, isFav, voters.length]);
  return (
    <Marker position={coords} icon={icon}>
      <Popup maxWidth={300} className="map-popup-wrapper" autoPanPadding={[28, 28]}>
        <RacePopupContent race={race} isFav={isFav} voters={voters} onToggleFav={onToggleFav} />
      </Popup>
    </Marker>
  );
}

function ExploreMarker({ site, coords, voters }: { site: ExploreSite; coords: [number, number]; voters: string[] }) {
  const color = CATEGORY_COLORS[site.category] ?? "#94a3b8";
  const label = site.category.toUpperCase();
  const icon = useMemo(() => buildExploreIcon(label, color), [label, color]);
  return (
    <Marker position={coords} icon={icon}>
      <Popup maxWidth={280} className="map-popup-wrapper" autoPanPadding={[28, 28]}>
        <ExplorePopupContent site={site} voters={voters} />
      </Popup>
    </Marker>
  );
}

// ── Pins layer — lives inside <MapContainer> so it can read the live map instance ──
function MapPins({ displayRaces, sites, showRaces, showExplore, favSet, votesByRace, exploreVotesBySite, onToggleFav }: {
  displayRaces: Race[]; sites: ExploreSite[]; showRaces: boolean; showExplore: boolean;
  favSet: Set<number>; votesByRace: Map<number, string[]>; exploreVotesBySite: Map<number, string[]>; onToggleFav: Props["onToggleFav"];
}) {
  const [zoom, setZoom] = useState(() => 4);
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  // Raw, un-spread coordinates — used to decide clustering so that decision is never
  // distorted by a previous spread pass (see spreadOverlappingPoints's comment above).
  const rawCoords = useMemo(() => {
    const coords = new Map<string, [number, number]>();
    if (showRaces) displayRaces.forEach(race => {
      const c = getCoords(race);
      if (c) coords.set(`r:${race.id}`, c);
    });
    if (showExplore) sites.forEach(site => {
      if (!site.lat || !site.lng) return;
      const lat = parseFloat(site.lat), lng = parseFloat(site.lng);
      if (!isNaN(lat) && !isNaN(lng)) coords.set(`e:${site.id}`, [lat, lng]);
    });
    return coords;
  }, [displayRaces, sites, showRaces, showExplore]);

  // Groups of 4 or fewer are shown as individual pins right away instead of a cluster
  // bubble the user has to click/zoom through. Uses the same radius the cluster group
  // below would use, so the boundary lines up with where a "5" bubble would have formed.
  const { soloRaceIds, soloSiteIds } = useMemo(() => {
    const soloRaceIds = new Set<number>();
    const soloSiteIds = new Set<number>();
    if (showRaces) {
      const racePoints = displayRaces
        .map(race => { const c = rawCoords.get(`r:${race.id}`); return c ? { id: race.id, lat: c[0], lng: c[1] } : null; })
        .filter((p): p is { id: number; lat: number; lng: number } => p !== null);
      groupByPixelDistance(map, racePoints, RACE_CLUSTER_RADIUS_PX).forEach(group => {
        if (group.length <= SOLO_GROUP_MAX_SIZE) group.forEach(p => soloRaceIds.add(p.id));
      });
    }
    if (showExplore) {
      const sitePoints = sites
        .map(site => { const c = rawCoords.get(`e:${site.id}`); return c ? { id: site.id, lat: c[0], lng: c[1] } : null; })
        .filter((p): p is { id: number; lat: number; lng: number } => p !== null);
      groupByPixelDistance(map, sitePoints, EXPLORE_CLUSTER_RADIUS_PX).forEach(group => {
        if (group.length <= SOLO_GROUP_MAX_SIZE) group.forEach(p => soloSiteIds.add(p.id));
      });
    }
    return { soloRaceIds, soloSiteIds };
    // zoom is read only to retrigger this memo when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, rawCoords, displayRaces, sites, showRaces, showExplore, zoom]);

  // Only the markers that will actually render individually (the solo set above) need
  // separation — clustered markers stay at their raw position since they're hidden inside
  // a bubble anyway, so it doesn't matter if several sit at literally the same spot.
  const pinCoords = useMemo(() => {
    const soloPoints: GeoPoint[] = [];
    rawCoords.forEach((coords, id) => {
      const isSolo = id.startsWith("r:") ? soloRaceIds.has(Number(id.slice(2))) : soloSiteIds.has(Number(id.slice(2)));
      if (isSolo) soloPoints.push({ id, lat: coords[0], lng: coords[1] });
    });
    const result = new Map(rawCoords);
    spreadOverlappingPoints(map, soloPoints).forEach((coords, id) => result.set(id, coords));
    return result;
    // zoom is read only to retrigger this memo when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, rawCoords, soloRaceIds, soloSiteIds, zoom]);

  return (
    <>
      {showRaces && (
        <>
          {displayRaces.filter(race => soloRaceIds.has(race.id)).map(race => {
            const coords = pinCoords.get(`r:${race.id}`);
            if (!coords) return null;
            return (
              <RaceMarker
                key={race.id}
                race={race}
                coords={coords}
                isFav={favSet.has(race.id)}
                voters={votesByRace.get(race.id) ?? []}
                onToggleFav={onToggleFav}
              />
            );
          })}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={RACE_CLUSTER_RADIUS_PX}
            iconCreateFunction={raceClusterIcon}
            showCoverageOnHover={false}
            zoomToBoundsOnClick
          >
            {displayRaces.filter(race => !soloRaceIds.has(race.id)).map(race => {
              const coords = pinCoords.get(`r:${race.id}`);
              if (!coords) return null;
              return (
                <RaceMarker
                  key={race.id}
                  race={race}
                  coords={coords}
                  isFav={favSet.has(race.id)}
                  voters={votesByRace.get(race.id) ?? []}
                  onToggleFav={onToggleFav}
                />
              );
            })}
          </MarkerClusterGroup>
        </>
      )}
      {showExplore && (
        <>
          {sites.filter(site => soloSiteIds.has(site.id)).map(site => {
            const coords = pinCoords.get(`e:${site.id}`);
            if (!coords) return null;
            return <ExploreMarker key={site.id} site={site} coords={coords} voters={exploreVotesBySite.get(site.id) ?? []} />;
          })}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={EXPLORE_CLUSTER_RADIUS_PX}
            iconCreateFunction={exploreClusterIcon}
            showCoverageOnHover={false}
            zoomToBoundsOnClick
          >
            {sites.filter(site => !soloSiteIds.has(site.id)).map(site => {
              const coords = pinCoords.get(`e:${site.id}`);
              if (!coords) return null;
              return <ExploreMarker key={site.id} site={site} coords={coords} voters={exploreVotesBySite.get(site.id) ?? []} />;
            })}
          </MarkerClusterGroup>
        </>
      )}
    </>
  );
}

// ── Tell Leaflet to recompute its internal size whenever its container's actual pixel
// size changes (e.g. entering/exiting fullscreen) — Leaflet has no way to know its CSS
// height changed unless invalidateSize() is called explicitly. A ResizeObserver on the
// container catches this regardless of what caused the resize, not just our own toggle.
function InvalidateSizeOnResize({ trigger }: { trigger: unknown }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);
  useEffect(() => { map.invalidateSize(); }, [map, trigger]);
  return null;
}

// ── Imperative bits that still need direct map access: initial fit, recenter button,
// and keeping the dragging/scrollWheelZoom/touchZoom handlers in sync with isFullscreen
// — none of these are hacks, just things Leaflet itself doesn't expose as
// declarative props, or (for dragging/scrollWheelZoom) that react-leaflet's MapContainer
// only applies once at construction time and never reactively re-pushes on prop changes
// (the same root cause as the earlier fullscreen-height bug — see InvalidateSizeOnResize). ──
function MapController({ displayRaces, recenterRef, isFullscreen, allowDragging }: { displayRaces: Race[]; recenterRef?: Props["recenterRef"]; isFullscreen: boolean; allowDragging: boolean }) {
  const map = useMap();
  const hasInitialFitRef = useRef(false);

  // MapContainer's dragging prop is only applied once at construction time and never
  // reactively re-pushed to the underlying Leaflet instance, so toggling fullscreen
  // never actually re-enabled 1-finger dragging — sync it imperatively instead.
  useEffect(() => {
    if (allowDragging) map.dragging.enable(); else map.dragging.disable();
  }, [map, allowDragging]);

  // Embedded map behaves like a standard static map embed: wheel/trackpad input always
  // scrolls the page, never zooms the map (use the visible +/- control or Fullscreen for
  // that instead). Only fullscreen enables scroll-wheel zoom, where there's nothing else
  // to scroll so it can't conflict with anything.
  useEffect(() => {
    if (isFullscreen) map.scrollWheelZoom.enable(); else map.scrollWheelZoom.disable();
  }, [map, isFullscreen]);

  // Leaflet detects "touch capable" via `window.TouchEvent` existing as a constructor —
  // true in every desktop Chrome build regardless of actual touch hardware (Chrome
  // exposes the constructor for web-compat even on trackpad/mouse-only Macs), not via
  // navigator.maxTouchPoints. So Leaflet's TouchZoom handler (pinch-zoom-via-touch) ends
  // up enabled by default even on a plain desktop trackpad, adding a non-passive
  // touchstart/touchmove listener and the .leaflet-touch-zoom class purely for a gesture
  // this device can't actually produce — that's what was eating two-finger trackpad
  // swipes over the embedded map in Chrome/macOS instead of letting them scroll the page.
  // Disabling it in embedded mode removes that listener entirely; fullscreen keeps it on
  // for real touchscreens (iPad/phone), where pinch-zoom-to-touch is actually useful.
  useEffect(() => {
    if (isFullscreen) map.touchZoom.enable(); else map.touchZoom.disable();
  }, [map, isFullscreen]);

  // Embedded map: drag-to-pan via mouse, implemented by hand instead of Leaflet's own
  // `dragging` handler. Enabling that handler — even just for mouse panning — makes
  // Leaflet add its .leaflet-touch-drag class (touch-action: none), which is what was
  // blocking Safari's trackpad/wheel page-scroll over the map. Listening for raw mouse
  // events ourselves and calling map.panBy() directly gets the same drag UX without
  // ever touching that class. Only real "mousedown" events trigger this — touch taps
  // don't fire it — so it naturally only affects mouse users, never touchscreens.
  useEffect(() => {
    if (isFullscreen) return;
    const container = map.getContainer();
    let dragging = false;
    let last: { x: number; y: number } | null = null;
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest(".leaflet-marker-icon, .leaflet-popup, .leaflet-control, .marker-cluster")) return;
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      container.style.cursor = "grabbing";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging || !last) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      map.panBy([-dx, -dy], { animate: false });
    };
    const onMouseUp = () => {
      dragging = false;
      last = null;
      container.style.cursor = "grab";
    };
    container.style.cursor = "grab";
    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      container.style.cursor = "";
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [map, isFullscreen]);

  // Embedded map: two-finger drag-to-pan via touch — separate from the mouse-drag
  // effect above and from Leaflet's own dragging/touchZoom handlers (both still kept
  // disabled here). A real two-finger touch gesture is claimed for map panning by
  // calling preventDefault only once exactly 2 touches are active; a single finger is
  // left completely alone (no listener logic runs, no preventDefault) so the existing
  // touch-action: pan-x pan-y CSS keeps letting the browser scroll the page normally
  // for that case, same as today. touchmove must be registered non-passive so
  // preventDefault is honored for the 2-finger case — only that specific case ever
  // calls it, so 1-finger scroll performance/behavior is unaffected.
  useEffect(() => {
    if (isFullscreen) return;
    const container = map.getContainer();
    let lastMid: { x: number; y: number } | null = null;

    function midpoint(touches: TouchList): { x: number; y: number } {
      return { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 };
    }

    const onTouchStart = (e: TouchEvent) => {
      lastMid = e.touches.length === 2 ? midpoint(e.touches) : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) { lastMid = null; return; }
      const mid = midpoint(e.touches);
      if (lastMid) {
        map.panBy([-(mid.x - lastMid.x), -(mid.y - lastMid.y)], { animate: false });
      }
      lastMid = mid;
      e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      lastMid = e.touches.length === 2 ? midpoint(e.touches) : null;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [map, isFullscreen]);

  useEffect(() => {
    if (hasInitialFitRef.current || displayRaces.length === 0) return;
    const coords = displayRaces.map(r => getCoords(r)).filter((c): c is [number, number] => c !== null);
    if (coords.length === 0) return;
    hasInitialFitRef.current = true;
    if (coords.length === 1) {
      map.setView(coords[0], 8, { animate: false });
    } else {
      map.fitBounds(L.latLngBounds(coords), { padding: [48, 48], maxZoom: 6, animate: false });
    }
  }, [map, displayRaces]);

  useEffect(() => {
    if (!recenterRef) return;
    recenterRef.current = () => {
      const coords = displayRaces.map(r => getCoords(r)).filter((c): c is [number, number] => c !== null);
      if (coords.length === 0) return;
      if (coords.length === 1) map.setView(coords[0], 8, { animate: true });
      else map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 6, animate: true });
    };
  }, [map, displayRaces, recenterRef]);

  return null;
}

function ThemeTileLayer({ isDark }: { isDark: boolean }) {
  const lightUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const darkUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
  const lightAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, &copy; <a href="https://carto.com/">CARTO</a>';
  const darkAttr = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ';
  return (
    <>
      {isDark ? (
        <TileLayer key="dark" url={darkUrl} maxZoom={16} attribution={darkAttr} />
      ) : (
        <TileLayer key="light" url={lightUrl} subdomains="abcd" maxZoom={16} attribution={lightAttr} />
      )}
      {/* Ocean Base overlay at low opacity gives blue water on the dark canvas basemap */}
      {isDark && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
          opacity={0.45}
          maxZoom={16}
          attribution=""
        />
      )}
    </>
  );
}

export default function MapView({ races, allRaces, sites, favSet, votesByRace, exploreVotesBySite, showFavsOnly, onToggleFav, isDark, hidePast, onToggleHidePast, showUnconfirmed, onToggleUnconfirmed, recenterRef, isFullscreen, onToggleFullscreen, showFilterBar, onToggleFilterBar, activeFilterCount, onClearAllFilters, onToggleFavs, sortMode, onToggleMostVoted, onToggleTheme, showSearch, onToggleSearch }: Props) {
  const [showExplore, setShowExplore] = useState(true);
  const [showRaces, setShowRaces] = useState(true);
  const [showLayersMenu, setShowLayersMenu] = useState(false);

  const displayRaces = showFavsOnly ? allRaces.filter(r => favSet.has(r.id)) : races;

  // Whether the floating filters/search panel (rendered by the page, anchored just
  // below the logo row) is currently showing — in either mode now, since Filters/View/
  // Search live on the map itself in both. Map buttons need to dodge under it the same
  // way they already dodge the fullscreen header, rather than only checking isFullscreen.
  const filterPanelOpen = showFilterBar || showSearch || activeFilterCount > 0;

  useEffect(() => {
    if (document.getElementById("map-popup-style")) return;
    const el = document.createElement("style");
    el.id = "map-popup-style";
    el.textContent = POPUP_STYLE;
    document.head.appendChild(el);
  }, []);

  // Dragging (click/touch-and-pan) is only enabled in fullscreen. In the embedded map,
  // enabling it — even just for desktop mouse-drag panning — makes Leaflet add its
  // .leaflet-touch-drag class, which sets touch-action: none on the container; Safari's
  // trackpad/wheel-scroll pipeline (unlike Chrome/Firefox) honors that for non-touch
  // input too, silently blocking the page from scrolling under the cursor. Keeping
  // dragging off entirely in embedded mode avoids that class ever being applied, so
  // the page always scrolls normally there — pinch-to-zoom (touchZoom) is unaffected.
  const allowDragging = isFullscreen;

  function handleToggleExplore() {
    const next = !showExplore;
    setShowExplore(next);
    // If turning Explore OFF while Races is OFF, snap Races back to ON
    if (!next && !showRaces) setShowRaces(true);
  }

  function handleToggleRaces() {
    if (!showExplore) return; // locked unless Explore is ON
    setShowRaces(prev => !prev);
  }

  // Map overlay buttons switch theme via this isDark prop directly rather than Tailwind's
  // dark: variant — this app's theme toggle only ever adds/removes a .light class on <html>
  // (dark is the unmarked default), so dark: (which requires a .dark ancestor) never matches.
  const pillBg = isDark ? "bg-zinc-900/95" : "bg-white/95";
  const pillBorder = isDark ? "border-zinc-600" : "border-zinc-300";
  const pillText = isDark ? "text-zinc-300" : "text-zinc-600";
  const pillTextDisabled = isDark ? "text-zinc-600" : "text-zinc-400";
  const blueText = isDark ? "text-blue-400" : "text-blue-500";
  const greenText = isDark ? "text-green-400" : "text-green-500";
  const redText = isDark ? "text-red-400" : "text-red-500";
  const amberText = isDark ? "text-amber-400" : "text-amber-500";
  const tealText = isDark ? "text-teal-400" : "text-teal-500";

  // Any pin/time-range setting that differs from the default browsing view
  // (Races on, Explore off, Unconfirmed on, Past Events off) — drives the small
  // indicator dot on the Layers button so its state is still glanceable without
  // opening the menu.
  const layersCustomized = showExplore || !showRaces || !showUnconfirmed || !hidePast;

  // Races + Explore places with at least one vote, among the currently filtered
  // lists — mirrors the header's own "Most Voted" badge count. Most Voted now
  // spans both pin types, so the badge reflects the combined total rather than
  // races alone.
  const votedRaceCount = useMemo(() => {
    const raceIdSet = new Set(races.map(r => r.id));
    return [...votesByRace.keys()].filter(id => raceIdSet.has(id)).length;
  }, [races, votesByRace]);
  const votedSiteCount = useMemo(() => {
    const siteIdSet = new Set(sites.map(s => s.id));
    return [...exploreVotesBySite.keys()].filter(id => siteIdSet.has(id)).length;
  }, [sites, exploreVotesBySite]);
  const totalWithVotes = votedRaceCount + votedSiteCount;

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: isFullscreen ? "100%" : "var(--map-h, clamp(420px, 40vw, 450px))" }}
    >
      <MapContainer
        center={[20, 100]}
        zoom={4}
        minZoom={3}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging={allowDragging}
        touchZoom={true}
        className={`map-container w-full ${isFullscreen ? "map-fullscreen" : ""}`}
        style={{ height: "100%", zIndex: 1 }}
      >
        <ZoomControl position="bottomleft" />
        <ThemeTileLayer isDark={isDark} />
        <MapController displayRaces={displayRaces} recenterRef={recenterRef} isFullscreen={isFullscreen} allowDragging={allowDragging} />
        <InvalidateSizeOnResize trigger={isFullscreen} />
        <MapPins
          displayRaces={displayRaces}
          sites={sites}
          showRaces={showRaces}
          showExplore={showExplore}
          favSet={favSet}
          votesByRace={votesByRace}
          exploreVotesBySite={exploreVotesBySite}
          onToggleFav={onToggleFav}
        />
      </MapContainer>

      {/* Frosted edges under the notch / home-indicator safe areas — iOS Safari's own
          toolbar translucency only kicks in while actively scrolling, which fullscreen
          here disables, so its chrome renders opaque instead of blurring the map
          through it. These strips fake that same blurred-glass look ourselves: each is
          sized to exactly the safe-area inset and blurs/tints whatever map tile is
          directly behind it, regardless of what Safari's own chrome does above/below. */}
      {isFullscreen && (
        <>
          <div
            className="absolute inset-x-0 top-0 z-20 pointer-events-none backdrop-blur-xl bg-background/55"
            style={{ height: "env(safe-area-inset-top, 0px)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 z-20 pointer-events-none backdrop-blur-xl bg-background/55"
            style={{ height: "env(safe-area-inset-bottom, 0px)" }}
          />
        </>
      )}

      {/* Fullscreen toggle + Search — top-right. Dodges the floating filters/search
          panel via --filter-panel-h only while that panel is actually open. Doesn't
          add --header-h: in embedded mode this div's own top already starts right
          below the page header (normal document flow), and the floating panel is
          anchored at that same point — so from this div's own coordinate space the
          panel's bottom edge is just --filter-panel-h down, not header height again.
          (header-h is harmless to omit in fullscreen too, since the header is hidden
          there and its height is 0.) Adding header-h here was pushing these buttons
          toward the middle of the embedded map whenever filters were open.
          z-[510] (above the filter panel's z-[500]) so these buttons stay on top of
          it once scrolled — the panel is position:fixed and stays pinned to the
          viewport while this button cluster scrolls with the map underneath it, so
          without a higher z-index the panel would slide over and hide them. */}
      <div
        className="absolute right-3 z-[510] flex items-center gap-2"
        style={{
          top: filterPanelOpen
            ? "calc(var(--filter-panel-h, 0px) + env(safe-area-inset-top, 0px) + 12px)"
            : "calc(env(safe-area-inset-top, 0px) + 12px)",
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
          marginRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <button
          onClick={onToggleSearch}
          title="Search"
          className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg shadow-md transition-all backdrop-blur-sm hover:brightness-110 ${
            showSearch ? `${pillBg} border-[1.5px] border-teal-400 ${tealText}` : `${pillBg} border ${pillBorder} ${pillText}`
          }`}
        >
          <Search size={16} />
        </button>
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen map"}
          className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-[11px] font-semibold shadow-md transition-all backdrop-blur-sm ${pillBg} border ${pillBorder} ${pillText} hover:brightness-110`}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Filters/Clear All/View — top-left, both modes now (Filters used to only live
          here in fullscreen, with a separate copy of these controls inline in the page
          header otherwise; consolidated into one set so toggling fullscreen doesn't
          change where anything is). Wraps onto a second line on narrow screens instead
          of overflowing off-screen. z-[510] for the same reason as the top-right
          cluster — stays above the fixed filter panel once scrolled. */}
      <div className="absolute left-3 z-[510] flex flex-wrap items-center gap-2" style={{ top: filterPanelOpen ? "calc(var(--filter-panel-h, 0px) + env(safe-area-inset-top, 0px) + 12px)" : "calc(env(safe-area-inset-top, 0px) + 12px)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))", marginLeft: "env(safe-area-inset-left, 0px)", maxWidth: "calc(100% - 24px)" }}>
        <button
          onClick={onToggleFilterBar}
          className={`flex items-center gap-1.5 px-3.5 sm:px-3 h-9 sm:h-8 rounded-lg text-xs sm:text-[11px] font-semibold shadow-md transition-all backdrop-blur-sm hover:brightness-110 whitespace-nowrap ${
            showFilterBar || activeFilterCount > 0
              ? `${pillBg} border-[1.5px] border-teal-400 ${tealText}`
              : `${pillBg} border ${pillBorder} ${pillText}`
          }`}
        >
          <Filter size={16} className="shrink-0" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-teal-500 text-white rounded-full w-5 h-5 sm:w-4 sm:h-4 flex items-center justify-center text-[11px] sm:text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAllFilters}
            title="Clear all filters"
            className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg shadow-md transition-all backdrop-blur-sm hover:brightness-110 ${pillBg} border ${pillBorder} ${pillText}`}
          >
            <X size={16} />
          </button>
        )}
        {/* Favourites + Most Voted — directly tappable standalone buttons rather than
            hidden inside a "View" dropdown, so they're reachable in one tap. Icon-only
            on mobile to save space, icon + label on desktop — same responsive pattern
            Filters already uses (hidden sm:inline). Both now span races AND Explore
            places (favSet/showFavsOnly already did; totalWithVotes is the combined
            voted-races + voted-sites count). */}
        <button
          onClick={onToggleFavs}
          title="Favourites Only"
          className={`relative flex items-center gap-1.5 px-3 sm:px-2.5 h-9 sm:h-8 rounded-lg text-xs sm:text-[11px] font-semibold shadow-md transition-all backdrop-blur-sm hover:brightness-110 whitespace-nowrap ${
            showFavsOnly ? `${pillBg} border-[1.5px] border-yellow-400 text-yellow-500` : `${pillBg} border ${pillBorder} ${pillText}`
          }`}
        >
          <Star size={16} className="shrink-0" fill={showFavsOnly ? "currentColor" : "none"} />
          <span className="hidden sm:inline">Favourites</span>
          {favSet.size > 0 && (
            <span className={`rounded-full w-5 h-5 sm:w-4 sm:h-4 flex items-center justify-center text-[11px] sm:text-[10px] font-bold ${
              showFavsOnly ? "bg-yellow-500 text-black" : "bg-muted text-current"
            }`}>{favSet.size}</span>
          )}
        </button>
        <button
          onClick={onToggleMostVoted}
          title="Sort by Most Voted"
          className={`relative flex items-center gap-1.5 px-3 sm:px-2.5 h-9 sm:h-8 rounded-lg text-xs sm:text-[11px] font-semibold shadow-md transition-all backdrop-blur-sm hover:brightness-110 whitespace-nowrap ${
            sortMode === "votes" ? `${pillBg} border-[1.5px] border-orange-400 text-orange-500` : `${pillBg} border ${pillBorder} ${pillText}`
          }`}
        >
          <TrendingUp size={16} className="shrink-0" />
          <span className="hidden sm:inline">Most Voted</span>
          {totalWithVotes > 0 && (
            <span className={`rounded-full w-5 h-5 sm:w-4 sm:h-4 flex items-center justify-center text-[11px] sm:text-[10px] font-bold ${
              sortMode === "votes" ? "bg-orange-500 text-black" : "bg-muted text-current"
            }`}>{totalWithVotes}</span>
          )}
        </button>
      </div>

      {/* Theme toggle + Layers — bottom-right, stacked. Grouped together since both
          control what the map looks like (tile style vs. which pins/time-range
          show), unlike Fullscreen which is purely a viewport control and now lives
          alone at top-right. Layers consolidates the 4 pin/time-range toggles
          (Races, Explore, Unconfirmed, Past Events) that used to sit here as
          always-visible pills into one button + popover, so they stop competing
          for space on narrow mobile screens. The small dot signals a non-default
          state without needing to open the menu. Stays at z-10 (below the filter
          panel's z-500), unlike the top two clusters — those needed elevating
          because page-scroll could hide genuinely-visible map content behind the
          panel. This one is anchored to the map's bottom edge, which a tall open
          filter sub-panel can sit well below (taller than the whole embedded map);
          elevating it there would just punch these buttons through the panel's own
          pills rather than reveal anything useful, since the map itself isn't
          visible at that point either. Bottom offset adds safe-area-inset-bottom —
          in fullscreen this div's bottom edge is the literal physical screen edge
          (under viewport-fit=cover), so without it these buttons would sit right at
          the home-indicator strip instead of comfortably above it. */}
      <div className="absolute right-3 z-10 flex flex-col items-end gap-2" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))", marginRight: "env(safe-area-inset-right, 0px)" }}>
        <button
          onClick={onToggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg shadow-md transition-all backdrop-blur-sm hover:brightness-110 ${pillBg} border ${pillBorder} ${pillText}`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      <div className="relative">
        {showLayersMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowLayersMenu(false)} />
            <div
              onClick={e => e.stopPropagation()}
              className={`absolute bottom-11 right-0 z-20 rounded-xl border ${pillBorder} ${pillBg} backdrop-blur-sm shadow-lg p-2 flex flex-col gap-1`}
              style={{ minWidth: 210 }}
            >
              <div className={`text-[11px] font-bold uppercase tracking-wide px-2 pt-1 pb-1.5 ${pillTextDisabled}`}>Pins</div>
              <button
                onClick={handleToggleRaces}
                disabled={!showExplore}
                title={!showExplore ? "Enable Explore first" : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !showExplore ? `${pillTextDisabled} cursor-not-allowed opacity-50` : showRaces ? `${blueText} bg-blue-400/10` : `${pillText} hover:bg-white/5`
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Races
                <span className="ml-auto text-[11px] font-bold opacity-70">{showRaces ? "ON" : "OFF"}</span>
              </button>
              <button
                onClick={handleToggleExplore}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${showExplore ? `${greenText} bg-green-400/10` : `${pillText} hover:bg-white/5`}`}
              >
                {showExplore
                  ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                }
                Explore
                <span className="ml-auto text-[11px] font-bold opacity-70">{showExplore ? "ON" : "OFF"}</span>
              </button>
              <div className={`text-[11px] font-bold uppercase tracking-wide px-2 pt-2 pb-1.5 mt-0.5 border-t ${pillBorder} ${pillTextDisabled}`}>Time range</div>
              <button
                onClick={onToggleUnconfirmed}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${showUnconfirmed ? `${redText} bg-red-400/10` : `${pillText} hover:bg-white/5`}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Unconfirmed
                <span className="ml-auto text-[11px] font-bold opacity-70">{showUnconfirmed ? "ON" : "OFF"}</span>
              </button>
              <button
                onClick={onToggleHidePast}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${!hidePast ? `${amberText} bg-amber-400/10` : `${pillText} hover:bg-white/5`}`}
              >
                {!hidePast
                  ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                }
                Past Events
                <span className="ml-auto text-[11px] font-bold opacity-70">{!hidePast ? "ON" : "OFF"}</span>
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setShowLayersMenu(v => !v)}
          title="Map layers"
          className={`relative flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg shadow-md transition-all backdrop-blur-sm hover:brightness-110 ${pillBg} border ${pillBorder} ${pillText}`}
        >
          <Layers size={16} />
          {layersCustomized && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-teal-400 border border-black/20" />
          )}
        </button>
      </div>
      </div>
    </div>
  );
}
