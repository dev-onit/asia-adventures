import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Maximize2, Minimize2, Filter, X, Star, TrendingUp, Sun, Moon, Layers, Search, Thermometer, Waves, Calendar } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Race, ExploreSite } from "../../../shared/schema";
import { getCoords, COUNTRY_WEATHER } from "../lib/raceGeo";
import { getRaceWeather } from "../lib/weatherData";
import { getDistPillClass } from "../lib/distancePills";
import VoterChips from "./VoterChips";

interface Props {
  races: Race[];
  allRaces: Race[];
  sites: ExploreSite[];
  favSet: Set<number>;
  voterName: string;
  votesByRace: Map<number, string[]>;
  exploreFavSet: Set<number>;
  exploreVotesBySite: Map<number, string[]>;
  showFavsOnly: boolean;
  countryFilters: string[];
  onToggleFav: (raceId: number, isFav: boolean) => void;
  onToggleExploreFav: (exploreSiteId: number) => void;
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
  highlightRaceId?: number | null;
  highlightSiteId?: number | null;
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

// ── Star (personal favourite) + vote-count badges overlaid on a pin icon — shared by
// race and Explore pins so both carry the same at-a-glance signals on the map itself,
// not just in the popup. ──
function pinBadgesHtml(isFav: boolean, voteCount: number): string {
  const starHtml = isFav
    ? `<div style="position:absolute;top:${BADGE_PAD-7}px;right:${BADGE_PAD-7}px;width:14px;height:14px;background:#facc15;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;line-height:1;color:#000;font-weight:900;pointer-events:none;box-shadow:0 0 5px rgba(250,204,21,0.8),0 1px 2px rgba(0,0,0,0.4);z-index:20">★</div>`
    : "";
  const voteHtml = voteCount > 0
    ? `<div style="position:absolute;bottom:${BADGE_PAD-7}px;right:${BADGE_PAD-7}px;min-width:14px;height:14px;background:#3b82f6;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:#fff;line-height:1;padding:0 3px;pointer-events:none;box-shadow:0 0 5px rgba(59,130,246,0.7),0 1px 2px rgba(0,0,0,0.4);z-index:20">${voteCount}</div>`
    : "";
  return starHtml + voteHtml;
}

// ── Race icon HTML (pill + badges) ──
function raceIconHtml(fill: string, label: string, isFav: boolean, voteCount: number, pillW: number, pillH: number, highlight: boolean): string {
  const totalW = pillW + BADGE_PAD * 2;
  const totalH = pillH + BADGE_PAD * 2;
  const pulseHtml = highlight
    ? `<div style="position:absolute;top:50%;left:50%;width:${totalW + 22}px;height:${totalH + 22}px;border-radius:50%;border:3px solid #3b82f6;animation:pin-pulse 0.85s ease-out 4;pointer-events:none"></div>`
    : "";
  return `<div style="position:relative;width:${totalW}px;height:${totalH}px;overflow:visible">
    ${pulseHtml}
    <div style="position:absolute;top:${BADGE_PAD}px;left:${BADGE_PAD}px">${sportPillSvg(fill, label, pillW, pillH)}</div>
    ${pinBadgesHtml(isFav, voteCount)}
  </div>`;
}

function buildRaceIcon(fill: string, label: string, isFav: boolean, voteCount: number, highlight = false): L.DivIcon {
  const ph = 11, pv = 6, fontSize = 10, charW = fontSize * 0.62;
  const pillW = Math.round(label.length * charW + ph * 2);
  const pillH = fontSize + pv * 2;
  const totalW = pillW + BADGE_PAD * 2;
  const totalH = pillH + BADGE_PAD * 2;
  return L.divIcon({
    html: raceIconHtml(fill, label, isFav, voteCount, pillW, pillH, highlight),
    className: "",
    iconSize: [totalW, totalH],
    iconAnchor: [totalW / 2, totalH / 2],
    popupAnchor: [0, -(totalH / 2 + 8)],
  });
}

function buildExploreIcon(label: string, color: string, isFav: boolean, voteCount: number, highlight = false): L.DivIcon {
  const ph = 10, pv = 5, fontSize = 9, charW = fontSize * 0.65;
  const pillW = Math.round(label.length * charW + ph * 2);
  const pillH = fontSize + pv * 2;
  const totalW = pillW + BADGE_PAD * 2;
  const totalH = pillH + BADGE_PAD * 2;
  const pulseHtml = highlight
    ? `<div style="position:absolute;top:50%;left:50%;width:${totalW + 22}px;height:${totalH + 22}px;border-radius:50%;border:3px solid #3b82f6;animation:pin-pulse 0.85s ease-out 4;pointer-events:none"></div>`
    : "";
  const html = `<div style="position:relative;width:${totalW}px;height:${totalH}px;overflow:visible">
    ${pulseHtml}
    <div style="position:absolute;top:${BADGE_PAD}px;left:${BADGE_PAD}px">${explorePillSvg(label, color)}</div>
    ${pinBadgesHtml(isFav, voteCount)}
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
// Zoom-adaptive cluster radii — tighter at higher zoom so pins break apart sooner.
// Also passed as a function to MarkerClusterGroup's maxClusterRadius prop so the
// library's internal bundling matches the solo-pin decision below.
function raceClusterRadius(zoom: number): number {
  return zoom < 5 ? 80 : zoom < 7 ? 55 : 35;
}
function exploreClusterRadius(zoom: number): number {
  return zoom < 5 ? 70 : zoom < 7 ? 45 : 30;
}
// Groups at or below this size render as individual pins instead of a cluster bubble.
const SOLO_GROUP_MAX_SIZE = 7;

function spreadOverlappingPoints(map: L.Map, points: GeoPoint[]): Map<string, [number, number]> {
  // Must be >= the largest cluster-bundling radius below — otherwise two points just
  // outside this radius but still inside the bundling radius can both get marked
  // "solo" without ever being grouped here, and render solo-but-still-overlapping.
  const SPREAD_GROUP_PX = raceClusterRadius(map.getZoom());
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
    min-width: 220px; max-width: 280px;
    background: hsl(var(--card)); color: hsl(var(--card-foreground));
    border: 1px solid hsl(var(--border)); border-radius: 14px;
    padding: 16px; box-shadow: 0 6px 24px rgba(0,0,0,0.22);
  }
  .map-popup .mp-badge-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 10px; }
  .map-popup .mp-badge {
    display: inline-block; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    padding: 2px 8px; border-radius: 999px;
  }
  .map-popup .mp-name { font-size: 14px; font-weight: 700; line-height: 1.3; margin-bottom: 9px; color: hsl(var(--card-foreground)); }
  .map-popup a.mp-name-link { display: inline-block; text-decoration: none; cursor: pointer; }
  .map-popup a.mp-name-link:hover { color: hsl(var(--primary)); }
  .map-popup .mp-row { font-size: 11px; color: hsl(var(--muted-foreground)); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; line-height: 1.4; }
  .map-popup .mp-icon { font-size: 19px; line-height: 1; }
  .map-popup .mp-months { font-size: 11px; font-weight: 600; color: hsl(var(--primary)); margin-top: 8px; }
  .map-popup .mp-actions { display: flex; gap: 8px; margin-top: 12px; align-items: center; }
  .map-popup .mp-star-btn {
    padding: 7px 12px; border-radius: 8px;
    border: 1px solid hsl(var(--border)); background: hsl(var(--muted));
    color: hsl(var(--muted-foreground)); font-size: 12px; font-weight: 600;
    cursor: pointer; text-align: center; white-space: nowrap;
  }
  .map-popup .mp-star-btn.starred { background: hsl(45 85% 50% / 0.15); border-color: #facc15; color: #ca8a04; }
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
  @keyframes pin-pulse {
    0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(2.4); opacity: 0; }
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
  const distPills = (race.distanceLabel ?? "").split("·").map(p => p.trim()).filter(Boolean);

  return (
    <div className="map-popup">
      <div className="mp-badge-row">
        <span className="mp-badge" style={{ background: `${fill}22`, color: fill, border: `1px solid ${fill}55` }}>
          {label}{subLabel && <span style={{ opacity: 0.65, fontWeight: 500 }}> · {subLabel}</span>}
        </span>
        {distPills.map((p, i) => (
          <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold leading-none whitespace-nowrap ${getDistPillClass(p)}`}>{p}</span>
        ))}
      </div>
      {race.url ? (
        <a href={race.url} target="_blank" rel="noopener noreferrer" className="mp-name mp-name-link ext-link">
          {race.name}
        </a>
      ) : (
        <div className="mp-name">{race.name}</div>
      )}
      <div className="mp-row"><span className="mp-icon">{flag}</span> {race.country}, {race.location}</div>
      <div className="mp-row"><Calendar size={13} className="shrink-0" /> {race.date}</div>
      {weather && (
        <div className="mp-row">
          <Thermometer size={13} className="shrink-0" /> {weather.temp}°C · {weather.condition}
          {showWaterTemp && weather.waterTemp != null && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 4 }}>
              <Waves size={13} className="shrink-0" /> {weather.waterTemp}°C
            </span>
          )}
        </div>
      )}
      <div className="mp-actions">
        <button className={`mp-star-btn ${isFav ? "starred" : ""}`} onClick={() => onToggleFav(race.id, isFav)}>
          {isFav ? "★ Voted" : "☆ Vote"}
        </button>
        {voters.length > 0 && <VoterChips voters={voters} />}
      </div>
    </div>
  );
}

function ExplorePopupContent({ site, isFav, voters, onToggleExploreFav }: {
  site: ExploreSite; isFav: boolean; voters: string[]; onToggleExploreFav: (id: number) => void;
}) {
  const color = CATEGORY_COLORS[site.category] ?? "#94a3b8";
  const flag = COUNTRY_WEATHER[site.country]?.flag ?? "";
  // Real description data is already a terse 81-138 char blurb (by design) — this cap
  // is just a safety net well above that range so the popup never truncates an
  // already-short description on top of being short to begin with.
  const desc = site.description.length > 250 ? site.description.slice(0, 250) + "…" : site.description;
  return (
    <div className="map-popup">
      <div className="mp-badge-row">
        <span className="mp-badge" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>{site.category}</span>
      </div>
      {site.url ? (
        <a href={site.url} target="_blank" rel="noopener noreferrer" className="mp-name mp-name-link ext-link">
          {site.name}
        </a>
      ) : (
        <div className="mp-name">{site.name}</div>
      )}
      <div className="mp-row"><span className="mp-icon">{flag}</span> {site.country}{site.region ? <> · {site.region}</> : null}</div>
      <div className="mp-row" style={{ marginTop: 4, lineHeight: 1.5 }}>{desc}</div>
      {site.bestMonths && <div className="mp-months">Best: {site.bestMonths}</div>}
      <div className="mp-actions">
        <button className={`mp-star-btn ${isFav ? "starred" : ""}`} onClick={() => onToggleExploreFav(site.id)}>
          {isFav ? "★ Voted" : "☆ Vote"}
        </button>
        {voters.length > 0 && <VoterChips voters={voters} />}
      </div>
    </div>
  );
}

// ── Home-base location dots — always visible, not part of race/explore data ──
const HOME_LOCATIONS: { name: string; lat: number; lng: number }[] = [
  { name: "Prague",     lat: 50.0755, lng: 14.4378 },
  { name: "Bengaluru",  lat: 12.9716, lng: 77.5946 },
];

function HomeMarkers() {
  const icon = useMemo(() => L.divIcon({
    className: "",
    html: `<svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="5.5" fill="#ef4444" stroke="white" stroke-width="2"/>
    </svg>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  }), []);

  return (
    <>
      {HOME_LOCATIONS.map(loc => (
        <Marker key={loc.name} position={[loc.lat, loc.lng]} icon={icon}>
          <Popup maxWidth={140} className="map-popup-wrapper" autoPanPadding={[28, 28]}>
            <div style={{ padding: "6px 8px", fontWeight: 700, fontSize: 13, color: "hsl(var(--card-foreground))" }}>
              📍 {loc.name}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

// ── Markers ──
function RaceMarker({ race, coords, isFav, voters, onToggleFav, highlight }: {
  race: Race; coords: [number, number]; isFav: boolean; voters: string[]; onToggleFav: Props["onToggleFav"]; highlight?: boolean;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const map = useMap();
  const coordsRef = useRef(coords);
  coordsRef.current = coords;
  const legacyType = legacyTypeKey(race);
  const fill = TYPE_COLORS[legacyType] ?? "#6366f1";
  const label = TYPE_LETTERS[legacyType] ?? "?";
  const icon = useMemo(() => buildRaceIcon(fill, label, isFav, voters.length, !!highlight), [fill, label, isFav, voters.length, highlight]);
  useEffect(() => {
    if (!highlight) return;
    map.setView(coordsRef.current, Math.max(map.getZoom(), 7), { animate: true });
    const t = setTimeout(() => markerRef.current?.openPopup(), 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, map]);
  return (
    <Marker ref={markerRef as any} position={coords} icon={icon} zIndexOffset={200}>
      <Popup maxWidth={300} className="map-popup-wrapper" autoPanPadding={[28, 28]}>
        <RacePopupContent race={race} isFav={isFav} voters={voters} onToggleFav={onToggleFav} />
      </Popup>
    </Marker>
  );
}

function ExploreMarker({ site, coords, isFav, voters, onToggleExploreFav, highlight }: {
  site: ExploreSite; coords: [number, number]; isFav: boolean; voters: string[]; onToggleExploreFav: Props["onToggleExploreFav"]; highlight?: boolean;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const map = useMap();
  const coordsRef = useRef(coords);
  coordsRef.current = coords;
  const color = CATEGORY_COLORS[site.category] ?? "#94a3b8";
  const label = site.category.toUpperCase();
  const icon = useMemo(() => buildExploreIcon(label, color, isFav, voters.length, !!highlight), [label, color, isFav, voters.length, highlight]);
  useEffect(() => {
    if (!highlight) return;
    map.setView(coordsRef.current, Math.max(map.getZoom(), 7), { animate: true });
    const t = setTimeout(() => markerRef.current?.openPopup(), 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, map]);
  return (
    <Marker ref={markerRef as any} position={coords} icon={icon}>
      <Popup maxWidth={280} className="map-popup-wrapper" autoPanPadding={[28, 28]}>
        <ExplorePopupContent site={site} isFav={isFav} voters={voters} onToggleExploreFav={onToggleExploreFav} />
      </Popup>
    </Marker>
  );
}

// ── Pins layer — lives inside <MapContainer> so it can read the live map instance ──
function MapPins({ displayRaces, sites, showRaces, showExplore, favSet, votesByRace, exploreFavSet, exploreVotesBySite, onToggleFav, onToggleExploreFav, highlightRaceId, highlightSiteId }: {
  displayRaces: Race[]; sites: ExploreSite[]; showRaces: boolean; showExplore: boolean;
  favSet: Set<number>; votesByRace: Map<number, string[]>; exploreFavSet: Set<number>; exploreVotesBySite: Map<number, string[]>; onToggleFav: Props["onToggleFav"]; onToggleExploreFav: Props["onToggleExploreFav"];
  highlightRaceId?: number | null; highlightSiteId?: number | null;
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
      groupByPixelDistance(map, racePoints, raceClusterRadius(zoom)).forEach(group => {
        if (group.length <= SOLO_GROUP_MAX_SIZE) group.forEach(p => soloRaceIds.add(p.id));
      });
    }
    if (showExplore) {
      const sitePoints = sites
        .map(site => { const c = rawCoords.get(`e:${site.id}`); return c ? { id: site.id, lat: c[0], lng: c[1] } : null; })
        .filter((p): p is { id: number; lat: number; lng: number } => p !== null);
      groupByPixelDistance(map, sitePoints, exploreClusterRadius(zoom)).forEach(group => {
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
                highlight={highlightRaceId === race.id}
              />
            );
          })}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={raceClusterRadius}
            iconCreateFunction={raceClusterIcon}
            showCoverageOnHover={false}
            zoomToBoundsOnClick
            disableClusteringAtZoom={9}
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
                  highlight={highlightRaceId === race.id}
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
            return <ExploreMarker key={site.id} site={site} coords={coords} isFav={exploreFavSet.has(site.id)} voters={exploreVotesBySite.get(site.id) ?? []} onToggleExploreFav={onToggleExploreFav} highlight={highlightSiteId === site.id} />;
          })}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={exploreClusterRadius}
            iconCreateFunction={exploreClusterIcon}
            showCoverageOnHover={false}
            zoomToBoundsOnClick
            disableClusteringAtZoom={9}
          >
            {sites.filter(site => !soloSiteIds.has(site.id)).map(site => {
              const coords = pinCoords.get(`e:${site.id}`);
              if (!coords) return null;
              return <ExploreMarker key={site.id} site={site} coords={coords} isFav={exploreFavSet.has(site.id)} voters={exploreVotesBySite.get(site.id) ?? []} onToggleExploreFav={onToggleExploreFav} highlight={highlightSiteId === site.id} />;
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
function MapController({ displayRaces, sites, recenterRef, isFullscreen, allowDragging }: { displayRaces: Race[]; sites: ExploreSite[]; recenterRef?: Props["recenterRef"]; isFullscreen: boolean; allowDragging: boolean }) {
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

  const allCoords = (): [number, number][] => {
    const race: [number, number][] = displayRaces.map(r => getCoords(r)).filter((c): c is [number, number] => c !== null);
    const explore: [number, number][] = sites
      .filter(s => s.lat && s.lng)
      .map(s => [parseFloat(s.lat!), parseFloat(s.lng!)] as [number, number])
      .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));
    return [...race, ...explore];
  };

  useEffect(() => {
    if (hasInitialFitRef.current || displayRaces.length === 0) return;
    const coords = allCoords();
    if (coords.length === 0) return;
    hasInitialFitRef.current = true;
    if (coords.length === 1) {
      map.setView(coords[0], 8, { animate: false });
    } else {
      map.fitBounds(L.latLngBounds(coords), { padding: [48, 48], maxZoom: 6, animate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, displayRaces]);

  useEffect(() => {
    if (!recenterRef) return;
    recenterRef.current = () => {
      const coords = allCoords();
      if (coords.length === 0) return;
      if (coords.length === 1) map.setView(coords[0], 8, { animate: true });
      else map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 8, animate: true });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, displayRaces, sites, recenterRef]);

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

export default function MapView({ races, allRaces, sites, favSet, votesByRace, exploreFavSet, exploreVotesBySite, showFavsOnly, onToggleFav, onToggleExploreFav, isDark, hidePast, onToggleHidePast, showUnconfirmed, onToggleUnconfirmed, recenterRef, isFullscreen, onToggleFullscreen, showFilterBar, onToggleFilterBar, activeFilterCount, onClearAllFilters, onToggleFavs, sortMode, onToggleMostVoted, onToggleTheme, showSearch, onToggleSearch, highlightRaceId, highlightSiteId }: Props) {
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
        <MapController displayRaces={displayRaces} sites={sites} recenterRef={recenterRef} isFullscreen={isFullscreen} allowDragging={allowDragging} />
        <InvalidateSizeOnResize trigger={isFullscreen} />
        <MapPins
          displayRaces={displayRaces}
          sites={sites}
          showRaces={showRaces}
          showExplore={showExplore}
          favSet={favSet}
          votesByRace={votesByRace}
          exploreFavSet={exploreFavSet}
          exploreVotesBySite={exploreVotesBySite}
          onToggleFav={onToggleFav}
          onToggleExploreFav={onToggleExploreFav}
          highlightRaceId={highlightRaceId}
          highlightSiteId={highlightSiteId}
        />
        <HomeMarkers />
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

      {/* Fullscreen toggle — top-right. Dodges the floating filter panel via
          --filter-panel-h only while that panel is open. z-[510] (above the filter
          panel's z-[500]) so it stays on top when the panel is fixed and scrolls
          over it. */}
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
        {/* My Votes + Most Voted — directly tappable standalone buttons rather than
            hidden inside a "View" dropdown, so they're reachable in one tap. Icon-only
            on mobile to save space, icon + label on desktop — same responsive pattern
            Filters already uses (hidden sm:inline). Both now span races AND Explore
            places (favSet/showFavsOnly already did; totalWithVotes is the combined
            voted-races + voted-sites count). Starring something IS voting for it — same
            single mechanism, just named "Vote" everywhere now to match the votes pill
            and Most Voted language instead of mixing star/favourite terminology. */}
        <button
          onClick={onToggleFavs}
          title="My Votes"
          className={`relative flex items-center gap-1.5 px-3 sm:px-2.5 h-9 sm:h-8 rounded-lg text-xs sm:text-[11px] font-semibold shadow-md transition-all backdrop-blur-sm hover:brightness-110 whitespace-nowrap ${
            showFavsOnly ? `${pillBg} border-[1.5px] border-amber-400 text-amber-500` : `${pillBg} border ${pillBorder} ${pillText}`
          }`}
        >
          <Star size={16} className="shrink-0" fill={showFavsOnly ? "currentColor" : "none"} />
          <span className="hidden sm:inline">My Votes</span>
          {favSet.size > 0 && (
            <span className={`rounded-full w-5 h-5 sm:w-4 sm:h-4 flex items-center justify-center text-[11px] sm:text-[10px] font-bold ${
              showFavsOnly ? "bg-amber-400 text-black" : "bg-muted text-current"
            }`}>{favSet.size}</span>
          )}
        </button>
        <button
          onClick={onToggleMostVoted}
          title="Sort by Most Voted"
          className={`relative flex items-center gap-1.5 px-3 sm:px-2.5 h-9 sm:h-8 rounded-lg text-xs sm:text-[11px] font-semibold shadow-md transition-all backdrop-blur-sm hover:brightness-110 whitespace-nowrap ${
            sortMode === "votes" ? `${pillBg} border-[1.5px] border-blue-400 text-blue-500` : `${pillBg} border ${pillBorder} ${pillText}`
          }`}
        >
          <TrendingUp size={16} className="shrink-0" />
          <span className="hidden sm:inline">Most Voted</span>
          {totalWithVotes > 0 && (
            <span className={`rounded-full w-5 h-5 sm:w-4 sm:h-4 flex items-center justify-center text-[11px] sm:text-[10px] font-bold ${
              sortMode === "votes" ? "bg-blue-500 text-white" : "bg-muted text-current"
            }`}>{totalWithVotes}</span>
          )}
        </button>
      </div>

      {/* Search + Theme toggle + Layers — bottom-right, stacked. Grouped together
          since all three control map content/appearance, unlike Fullscreen which
          is a viewport control and lives alone at top-right. Layers consolidates the 4 pin/time-range toggles
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
          onClick={onToggleSearch}
          title="Search"
          className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg shadow-md transition-all backdrop-blur-sm hover:brightness-110 ${
            showSearch ? `${pillBg} border-[1.5px] border-teal-400 ${tealText}` : `${pillBg} border ${pillBorder} ${pillText}`
          }`}
        >
          <Search size={16} />
        </button>
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
