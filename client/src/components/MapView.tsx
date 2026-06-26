import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Maximize2, Minimize2, Filter, X, Star, TrendingUp, Sun, Moon } from "lucide-react";
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

function spreadOverlappingPoints(map: L.Map, points: GeoPoint[]): Map<string, [number, number]> {
  // Must be >= the largest cluster-bundling radius (60 for races) below — otherwise two
  // points just outside this radius but still inside the bundling radius can both get
  // marked "solo" without ever being grouped here, and render solo-but-still-overlapping.
  const SPREAD_GROUP_PX = 60;
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
    gap: 3px !important; border: none !important; border-radius: 0 !important;
    background: transparent !important; box-shadow: none !important;
  }
  .leaflet-bar a,
  .leaflet-control-zoom-in,
  .leaflet-control-zoom-out {
    width: 28px !important; height: 28px !important;
    line-height: 28px !important; font-size: 18px !important; font-weight: 400 !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    text-align: center !important; text-indent: 0 !important;
    padding: 0 !important; margin: 0 !important;
    border-radius: 7px !important; border: 1px solid !important;
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
`;

// ── Popup content (real React components — no HTML strings, no manual DOM wiring) ──
function RacePopupContent({ race, isFav, voters, onToggleFav }: {
  race: Race; isFav: boolean; voters: string[]; onToggleFav: Props["onToggleFav"];
}) {
  const fill = TYPE_COLORS[race.type] ?? "#6366f1";
  const label = TYPE_LABELS[race.type] ?? race.type;
  const subLabel = TYPE_SUBLABELS[race.type];
  const flag = COUNTRY_WEATHER[race.country]?.flag ?? "";
  const weather = getRaceWeather(race.location, race.date);
  const showWaterTemp = weather?.waterTemp != null && ["triathlon", "ocean-swim", "swimrun"].includes(race.type);

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

function ExplorePopupContent({ site }: { site: ExploreSite }) {
  const color = CATEGORY_COLORS[site.category] ?? "#94a3b8";
  const flag = COUNTRY_WEATHER[site.country]?.flag ?? "";
  const desc = site.description.length > 120 ? site.description.slice(0, 120) + "…" : site.description;
  return (
    <div className="map-popup">
      <span className="mp-badge" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>{site.category}</span>
      <div className="mp-name">{site.name}</div>
      <div className="mp-row">{flag} {site.country}{site.region ? <> · {site.region}</> : null}</div>
      <div className="mp-row" style={{ marginTop: 4, lineHeight: 1.5 }}>{desc}</div>
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
  const fill = TYPE_COLORS[race.type] ?? "#6366f1";
  const label = TYPE_LETTERS[race.type] ?? "?";
  const icon = useMemo(() => buildRaceIcon(fill, label, isFav, voters.length), [fill, label, isFav, voters.length]);
  return (
    <Marker position={coords} icon={icon}>
      <Popup maxWidth={300} className="map-popup-wrapper" autoPanPadding={[28, 28]}>
        <RacePopupContent race={race} isFav={isFav} voters={voters} onToggleFav={onToggleFav} />
      </Popup>
    </Marker>
  );
}

function ExploreMarker({ site, coords }: { site: ExploreSite; coords: [number, number] }) {
  const color = CATEGORY_COLORS[site.category] ?? "#94a3b8";
  const label = site.category.toUpperCase();
  const icon = useMemo(() => buildExploreIcon(label, color), [label, color]);
  return (
    <Marker position={coords} icon={icon}>
      <Popup maxWidth={280} className="map-popup-wrapper" autoPanPadding={[28, 28]}>
        <ExplorePopupContent site={site} />
      </Popup>
    </Marker>
  );
}

// ── Pins layer — lives inside <MapContainer> so it can read the live map instance ──
function MapPins({ displayRaces, sites, showRaces, showExplore, favSet, votesByRace, onToggleFav }: {
  displayRaces: Race[]; sites: ExploreSite[]; showRaces: boolean; showExplore: boolean;
  favSet: Set<number>; votesByRace: Map<number, string[]>; onToggleFav: Props["onToggleFav"];
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
      groupByPixelDistance(map, racePoints, 60).forEach(group => {
        if (group.length <= 4) group.forEach(p => soloRaceIds.add(p.id));
      });
    }
    if (showExplore) {
      const sitePoints = sites
        .map(site => { const c = rawCoords.get(`e:${site.id}`); return c ? { id: site.id, lat: c[0], lng: c[1] } : null; })
        .filter((p): p is { id: number; lat: number; lng: number } => p !== null);
      groupByPixelDistance(map, sitePoints, 50).forEach(group => {
        if (group.length <= 4) group.forEach(p => soloSiteIds.add(p.id));
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
            maxClusterRadius={60}
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
            return <ExploreMarker key={site.id} site={site} coords={coords} />;
          })}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            iconCreateFunction={exploreClusterIcon}
            showCoverageOnHover={false}
            zoomToBoundsOnClick
          >
            {sites.filter(site => !soloSiteIds.has(site.id)).map(site => {
              const coords = pinCoords.get(`e:${site.id}`);
              if (!coords) return null;
              return <ExploreMarker key={site.id} site={site} coords={coords} />;
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
// and ctrl/⌘+scroll-to-zoom — none of these are hacks, just things Leaflet itself doesn't
// expose as declarative props. ──
function MapController({ displayRaces, recenterRef }: { displayRaces: Race[]; recenterRef?: Props["recenterRef"] }) {
  const map = useMap();
  const hasInitialFitRef = useRef(false);

  useEffect(() => {
    const container = map.getContainer();
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) map.zoomIn(); else map.zoomOut();
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [map]);

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

export default function MapView({ races, allRaces, sites, favSet, votesByRace, showFavsOnly, onToggleFav, isDark, hidePast, onToggleHidePast, showUnconfirmed, onToggleUnconfirmed, recenterRef, isFullscreen, onToggleFullscreen, showFilterBar, onToggleFilterBar, activeFilterCount, onClearAllFilters, onToggleFavs, sortMode, onToggleMostVoted, onToggleTheme }: Props) {
  const [showExplore, setShowExplore] = useState(false);
  const [showRaces, setShowRaces] = useState(true);

  const displayRaces = showFavsOnly ? allRaces.filter(r => favSet.has(r.id)) : races;

  useEffect(() => {
    if (document.getElementById("map-popup-style")) return;
    const el = document.createElement("style");
    el.id = "map-popup-style";
    el.textContent = POPUP_STYLE;
    document.head.appendChild(el);
  }, []);

  // On touch devices: disable 1-finger dragging so the page scrolls naturally.
  // 2-finger pan still works via Leaflet's built-in two-touch handler. In fullscreen
  // there's nothing else to scroll (body scroll is locked there), so allow normal
  // 1-finger panning too — pinch-to-zoom (touchZoom) is unaffected either way.
  const isTouch = useMemo(() => 'ontouchstart' in window && navigator.maxTouchPoints > 0, []);
  const allowDragging = isFullscreen || !isTouch;

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
  const pillBorderDisabled = isDark ? "border-zinc-700" : "border-zinc-200";
  const pillTextDisabled = isDark ? "text-zinc-600" : "text-zinc-400";
  const blueText = isDark ? "text-blue-400" : "text-blue-500";
  const orangeText = isDark ? "text-orange-400" : "text-orange-500";
  const redText = isDark ? "text-red-400" : "text-red-500";
  const amberText = isDark ? "text-amber-400" : "text-amber-500";
  const tealText = isDark ? "text-teal-400" : "text-teal-500";

  // Races with at least one vote, among the currently filtered list — mirrors the
  // header's own "Most Voted" badge count.
  const racesWithVotes = useMemo(() => {
    const raceIdSet = new Set(races.map(r => r.id));
    return [...votesByRace.keys()].filter(id => raceIdSet.has(id)).length;
  }, [races, votesByRace]);

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
        className="map-container w-full"
        style={{ height: "100%", zIndex: 1 }}
      >
        <ZoomControl position="bottomleft" />
        <ThemeTileLayer isDark={isDark} />
        <MapController displayRaces={displayRaces} recenterRef={recenterRef} />
        <InvalidateSizeOnResize trigger={isFullscreen} />
        <MapPins
          displayRaces={displayRaces}
          sites={sites}
          showRaces={showRaces}
          showExplore={showExplore}
          favSet={favSet}
          votesByRace={votesByRace}
          onToggleFav={onToggleFav}
        />
      </MapContainer>

      {/* Fullscreen toggle + theme toggle — bottom-left, stacked directly above the
          Leaflet zoom +/- control so every icon-only map utility lives in one column.
          Fullscreen is always shown; theme only in fullscreen (otherwise the page
          header's own theme toggle is reachable). */}
      <div className="absolute left-3 z-10 flex flex-col gap-1.5" style={{ bottom: "78px", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))", marginLeft: "env(safe-area-inset-left, 0px)" }}>
        {isFullscreen && (
          <button
            onClick={onToggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`flex items-center justify-center w-7 h-7 rounded-lg shadow-md transition-all backdrop-blur-sm hover:brightness-110 ${pillBg} border ${pillBorder} ${pillText}`}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        )}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen map"}
          className={`flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-semibold shadow-md transition-all backdrop-blur-sm ${pillBg} border ${pillBorder} ${pillText} hover:brightness-110`}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Filters/Clear All/Favourites/Most Voted — top-left, fullscreen only (the page
          header providing this elsewhere is fully hidden while fullscreen). Wraps onto
          a second line on narrow screens instead of overflowing off-screen. */}
      {isFullscreen && (
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))", marginLeft: "env(safe-area-inset-left, 0px)", marginTop: "env(safe-area-inset-top, 0px)", maxWidth: "calc(100% - 24px)" }}>
          <button
            onClick={onToggleFilterBar}
            className={`flex items-center gap-1 px-2.5 py-1 h-7 rounded-lg text-[11px] font-semibold shadow-md transition-all backdrop-blur-sm hover:brightness-110 whitespace-nowrap ${
              showFilterBar || activeFilterCount > 0
                ? `${pillBg} border-[1.5px] border-teal-400 ${tealText}`
                : `${pillBg} border ${pillBorder} ${pillText}`
            }`}
          >
            <Filter size={13} className="shrink-0" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-teal-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={onClearAllFilters}
              title="Clear all filters"
              className={`flex items-center justify-center w-7 h-7 rounded-lg shadow-md transition-all backdrop-blur-sm hover:brightness-110 ${pillBg} border ${pillBorder} ${pillText}`}
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={onToggleFavs}
            className={`flex items-center gap-1 px-2.5 py-1 h-7 rounded-lg text-[11px] font-semibold shadow-md transition-all hover:brightness-110 backdrop-blur-sm whitespace-nowrap ${
              showFavsOnly ? "bg-yellow-400 border-[1.5px] border-yellow-400 text-black" : `${pillBg} border ${pillBorder} ${pillText}`
            }`}
          >
            <Star size={13} className="shrink-0" fill={showFavsOnly ? "black" : "none"} />
            Favourites
            {favSet.size > 0 && (
              <span className={`rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold ${showFavsOnly ? "bg-black/20 text-black" : "bg-yellow-500 text-black"}`}>
                {favSet.size}
              </span>
            )}
          </button>
          <button
            onClick={onToggleMostVoted}
            className={`flex items-center gap-1 px-2.5 py-1 h-7 rounded-lg text-[11px] font-semibold shadow-md transition-all hover:brightness-110 backdrop-blur-sm whitespace-nowrap ${
              sortMode === "votes" ? "bg-orange-400 border-[1.5px] border-orange-400 text-black" : `${pillBg} border ${pillBorder} ${pillText}`
            }`}
          >
            <TrendingUp size={13} className="shrink-0" />
            Most Voted
            {racesWithVotes > 0 && (
              <span className={`rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold ${sortMode === "votes" ? "bg-black/20 text-black" : "bg-orange-500/80 text-black"}`}>
                {racesWithVotes}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Explore/Races + Predicted/Past — bottom-right. Stacked (Explore/Races above
          Predicted/Past) on mobile; side by side as one row once there's enough width. */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col sm:flex-row items-end sm:items-center gap-1.5" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))", marginRight: "env(safe-area-inset-right, 0px)", maxWidth: "calc(100% - 60px)" }}>
        <div className="flex flex-wrap justify-end gap-1.5">
          <button
            onClick={handleToggleRaces}
            title={!showExplore ? "Enable Explore first" : undefined}
            className={`flex items-center gap-1 px-2.5 py-1 h-7 rounded-lg text-[11px] font-semibold shadow-md transition-all backdrop-blur-sm ${
              !showExplore
                ? `${pillBg} border ${pillBorderDisabled} ${pillTextDisabled} cursor-not-allowed opacity-50`
                : showRaces
                  ? `${pillBg} border ${pillBorder} ${pillText} hover:brightness-110`
                  : `${pillBg} border-[1.5px] border-blue-400 ${blueText} hover:brightness-110`
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {showRaces ? "Races: ON" : "Races: OFF"}
          </button>
          <button
            onClick={handleToggleExplore}
            className={`flex items-center gap-1 px-2.5 py-1 h-7 rounded-lg text-[11px] font-semibold shadow-md transition-all hover:brightness-110 backdrop-blur-sm ${
              showExplore ? `${pillBg} border-[1.5px] border-orange-400 ${orangeText}` : `${pillBg} border ${pillBorder} ${pillText}`
            }`}
          >
            {showExplore
              ? <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            }
            {showExplore ? "Explore: ON" : "Explore: OFF"}
          </button>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <button
            onClick={onToggleUnconfirmed}
            className={`flex items-center gap-1 px-2.5 py-1 h-7 rounded-lg text-[11px] font-semibold shadow-md transition-all hover:brightness-110 backdrop-blur-sm ${
              showUnconfirmed ? `${pillBg} border-[1.5px] border-red-400 ${redText}` : `${pillBg} border ${pillBorder} ${pillText}`
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {showUnconfirmed ? "Predicted: ON" : "Predicted: OFF"}
          </button>
          <button
            onClick={onToggleHidePast}
            className={`flex items-center gap-1 px-2.5 py-1 h-7 rounded-lg text-[11px] font-semibold shadow-md transition-all hover:brightness-110 backdrop-blur-sm ${
              !hidePast ? `${pillBg} border-[1.5px] border-amber-400 ${amberText}` : `${pillBg} border ${pillBorder} ${pillText}`
            }`}
          >
            {!hidePast
              ? <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
            }
            {!hidePast ? "Past Events: ON" : "Past Events: OFF"}
          </button>
        </div>
      </div>
    </div>
  );
}
