import React, { useEffect, useRef, useState } from "react";
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
  recenterRef?: React.MutableRefObject<(() => void) | null>;
}

const TYPE_COLORS: Record<string, string> = {
  running:      "#6366f1",
  triathlon:    "#0ea5e9",
  trail:        "#f97316",
  hyrox:        "#facc15",
  "ocean-swim": "#06b6d4",
  swimrun:      "#0891b2",
  duathlon:     "#22c55e",
  adventure:    "#a855f7",
};

const TYPE_LETTERS: Record<string, string> = {
  running:      "RUN",
  triathlon:    "TRI",
  trail:        "TRAIL",
  hyrox:        "HYR",
  "ocean-swim": "SWIM",
  swimrun:      "SWR",
  duathlon:     "DUA",
  adventure:    "ADV",
};

const TYPE_LABELS: Record<string, string> = {
  running: "Running", triathlon: "Triathlon", trail: "Trail",
  hyrox: "Hyrox", "ocean-swim": "Swimming", duathlon: "Duathlon",
  adventure: "Adventure", swimrun: "SwimRun", ocr: "OCR", xenom: "Xenom",
};

const CATEGORY_COLORS: Record<string, string> = {
  Mountains: "#f97316", Islands: "#06b6d4", Cities: "#8b5cf6",
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

// ── Cluster circle SVG — bold, solid, Apple Maps-style cluster ──
function clusterPillSvg(dominant: string, count: number, _label: string): string {
  // Fixed sizes: tiny (≤4)→20, small (≤9)→24, medium (≤20)→28, large (≤40)→32, huge→36
  const r = count <= 4 ? 20 : count <= 9 ? 24 : count <= 20 ? 28 : count <= 40 ? 32 : 36;
  const size = r * 2;
  const cx = r, cy = r;
  const fontSize = r <= 20 ? 13 : r <= 24 ? 14 : r <= 28 ? 15 : 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${CARD_DARK}"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 2.5}" fill="${dominant}" fill-opacity="0.55" stroke="${dominant}" stroke-width="2"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-family="system-ui,sans-serif" font-weight="900" letter-spacing="-0.5"
      fill="white" paint-order="stroke" stroke="${CARD_DARK}" stroke-width="2.5" stroke-linejoin="round">${count}</text>
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
    ? `<div style="position:absolute;bottom:${BADGE_PAD-7}px;right:${BADGE_PAD-7}px;min-width:14px;height:14px;background:#14b8a6;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:#000;line-height:1;padding:0 3px;pointer-events:none;box-shadow:0 0 5px rgba(20,184,166,0.8),0 1px 2px rgba(0,0,0,0.4);z-index:20">${voteCount}</div>`
    : "";
  return `<div style="position:relative;width:${totalW}px;height:${totalH}px;overflow:visible">
    <div style="position:absolute;top:${BADGE_PAD}px;left:${BADGE_PAD}px">${sportPillSvg(fill, label, pillW, pillH)}</div>
    ${starHtml}${voteHtml}
  </div>`;
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
  .map-popup .mp-editions { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
  .map-popup .mp-edition { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .map-popup .mp-year-tag { font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 999px; white-space: nowrap; }
  .map-popup .mp-edition-info { font-size: 11px; color: #94a3b8; flex: 1; }
  .map-popup .mp-edition-actions { display: flex; gap: 4px; margin-left: auto; align-items: center; }
  .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; border-radius: 14px !important; padding: 0 !important; }
  .leaflet-popup-content { margin: 0 !important; }
  .leaflet-popup-tip-container { display: none !important; }
  .leaflet-popup-close-button { color: hsl(var(--muted-foreground)) !important; font-size: 20px !important; width: 28px !important; height: 28px !important; top: 6px !important; right: 6px !important; }
  .leaflet-bar {
    display: flex !important; flex-direction: column !important;
    gap: 3px !important; border: none !important; border-radius: 0 !important;
    background: transparent !important; box-shadow: none !important;
  }
  .leaflet-bar a {
    width: 26px !important; height: 26px !important;
    line-height: 26px !important; font-size: 15px !important;
    border-radius: 7px !important; border: 1px solid !important;
    background: rgba(255,255,255,0.95) !important;
    border-color: rgb(212,212,216) !important;
    color: rgb(82,82,91) !important;
    box-shadow: 0 1px 4px rgba(0,0,0,0.18) !important;
  }
  .leaflet-bar a:hover { filter: brightness(0.95) !important; }
  .dark .leaflet-bar a {
    background: rgba(24,24,27,0.95) !important;
    border-color: rgb(63,63,70) !important;
    color: rgb(212,212,216) !important;
  }
`;

export default function MapView({ races, allRaces, sites, favSet, voterName, votesByRace, showFavsOnly, countryFilters, onToggleFav, isDark, hidePast, onToggleHidePast, showUnconfirmed, onToggleUnconfirmed, recenterRef }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [showExplore, setShowExplore] = useState(false);
  const showExploreRef = useRef(false);
  const [showRaces, setShowRaces] = useState(true);
  const showRacesRef = useRef(true);
  const lastRenderKeyRef = useRef<string>("");
  const renderMarkersRef = useRef<(force?: boolean) => void>(() => {});

  const displayRaces = showFavsOnly ? allRaces.filter(r => favSet.has(r.id)) : races;

  useEffect(() => {
    if (document.getElementById("map-popup-style")) return;
    const el = document.createElement("style");
    el.id = "map-popup-style";
    el.textContent = POPUP_STYLE;
    document.head.appendChild(el);
  }, []);

  // Swap tile layer on theme change
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;
    if (tileLayerRef.current) mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const url = isDark
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    const attr = isDark
      ? 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, &copy; <a href="https://carto.com/">CARTO</a>';
    tileLayerRef.current = L.tileLayer(url, { subdomains: "abcd", maxZoom: 16, attribution: attr }).addTo(mapInstanceRef.current);
    // Add/remove water overlay on theme change
    if ((tileLayerRef as any).waterLayer) {
      mapInstanceRef.current.removeLayer((tileLayerRef as any).waterLayer);
      delete (tileLayerRef as any).waterLayer;
    }
    if (isDark) {
      (tileLayerRef as any).waterLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
        { opacity: 0.45, maxZoom: 16, attribution: "" }
      ).addTo(mapInstanceRef.current);
    }
  }, [isDark]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Poll until Leaflet script finishes loading (dynamic <script> tag may not be ready yet)
    const tryInit = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstanceRef.current) return;
      clearInterval(poll);

    const map = L.map(mapRef.current, {
      center: [20, 100], zoom: 4, zoomControl: false,
      scrollWheelZoom: false, touchZoom: true, attributionControl: false,
    });

    mapRef.current.addEventListener("wheel", (e: WheelEvent) => {
      if (e.ctrlKey) { e.preventDefault(); e.stopPropagation(); if (e.deltaY < 0) map.zoomIn(); else map.zoomOut(); }
    }, { passive: false });

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    const url = isDark
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    const tileAttr = isDark
      ? 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, &copy; <a href="https://carto.com/">CARTO</a>';
    tileLayerRef.current = L.tileLayer(url, { subdomains: "abcd", maxZoom: 16, attribution: tileAttr }).addTo(map);
    // Water overlay: Ocean Base at 45% opacity gives blue water on dark map
    if (isDark) {
      (tileLayerRef as any).waterLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
        { opacity: 0.45, maxZoom: 16, attribution: "" }
      ).addTo(map);
    }
    mapInstanceRef.current = map;

    map.dragging.enable();
    mapRef.current.addEventListener("touchstart", (e: TouchEvent) => {
      if (e.touches.length >= 2) map.dragging.enable(); else map.dragging.disable();
    }, { passive: true });
    mapRef.current.addEventListener("touchend", () => { map.dragging.disable(); }, { passive: true });

    map.on("zoomend", () => { lastRenderKeyRef.current = ""; renderMarkersRef.current(true); });
    }; // end tryInit

    const poll = setInterval(tryInit, 100);
    tryInit(); // try immediately in case Leaflet is already loaded

    return () => {
      clearInterval(poll);
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  // ── HTML escape helper (prevent XSS in popup strings) ──
  const esc = (s: string) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  // ── Popup builders ──
  function buildGroupPopup(groupRaces: Race[], isFav: boolean, voters: string[]): string {
    const rep = groupRaces[0];
    const fill = TYPE_COLORS[rep.type] ?? "#6366f1";
    const label = TYPE_LABELS[rep.type] ?? rep.type;
    const flag = COUNTRY_WEATHER[rep.country]?.flag ?? "";
    const votersHtml = voters.length > 0 ? `<div class="mp-row">👥 ${voters.map(esc).join(", ")}</div>` : "";
    const weather = getRaceWeather(rep.location, rep.date);
    const showWaterTemp = weather?.waterTemp != null && ["triathlon", "ocean-swim", "swimrun"].includes(rep.type);
    const weatherHtml = weather
      ? `<div class="mp-row">🌡️ ${weather.temp}°C · ${esc(weather.condition)}${showWaterTemp ? ` <span style="margin-left:4px">🌊 ${weather.waterTemp}°C</span>` : ""}</div>`
      : "";
    const getYear = (d: string) => { const m = d.match(/(202\d)/); return m ? m[1] : d; };
    const sorted = [...groupRaces].sort((a, b) => getYear(a.date).localeCompare(getYear(b.date)));

    if (sorted.length === 1) {
      const r = sorted[0]; const rIsFav = favSet.has(r.id);
      const visitBtn = r.url ? `<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="mp-visit-btn">↗ Visit</a>` : "";
      return `<div class="map-popup">
        <span class="mp-badge" style="background:${fill}22;color:${fill};border:1px solid ${fill}55">${label}</span>
        <div class="mp-name">${rep.name}</div>
        <div class="mp-row">📍 ${esc(rep.location)}, ${flag} ${esc(rep.country)}</div>
        <div class="mp-row">📅 ${esc(r.date)} · ${esc(r.distance)}</div>
        ${votersHtml}
        ${weatherHtml}
        <div class="mp-actions">
          <button class="mp-star-btn ${rIsFav ? "starred" : ""}" data-race-id="${r.id}" data-is-fav="${rIsFav}">${rIsFav ? "★ Starred" : "☆ Star"}</button>
          ${visitBtn}
        </div>
      </div>`;
    }

    const editionsHtml = sorted.map(r => {
      const year = getYear(r.date); const rIsFav = favSet.has(r.id);
      const visitBtn = r.url ? `<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="mp-visit-btn" style="padding:5px 12px;font-size:11px;flex:none">↗ Visit</a>` : "";
      return `<div class="mp-edition">
        <span class="mp-year-tag" style="background:${fill}22;color:${fill};border:1px solid ${fill}55">${year}</span>
        <span class="mp-edition-info">📅 ${r.date} · ${r.distance}</span>
        <div class="mp-edition-actions">
          <button class="mp-star-btn ${rIsFav ? "starred" : ""}" data-race-id="${r.id}" data-is-fav="${rIsFav}" style="padding:4px 10px;font-size:10px">${rIsFav ? "★" : "☆"}</button>
          ${visitBtn}
        </div>
      </div>`;
    }).join("");

    return `<div class="map-popup">
      <span class="mp-badge" style="background:${fill}22;color:${fill};border:1px solid ${fill}55">${label}</span>
      <div class="mp-name">${rep.name}</div>
      <div class="mp-row">📍 ${esc(rep.location)}, ${flag} ${esc(rep.country)}</div>
      ${votersHtml}
      ${weatherHtml}
      <div class="mp-editions">${editionsHtml}</div>
    </div>`;
  }

  function buildExplorePopup(site: ExploreSite): string {
    const color = CATEGORY_COLORS[site.category] ?? "#94a3b8";
    const flag = COUNTRY_WEATHER[site.country]?.flag ?? "";
    const desc = site.description.length > 120 ? site.description.slice(0, 120) + "…" : site.description;
    const monthsHtml = site.bestMonths ? `<div class="mp-months">✦ Best: ${site.bestMonths}</div>` : "";
    const visitHtml = site.url ? `<a href="${site.url}" target="_blank" rel="noopener noreferrer" class="mp-visit-btn" style="margin-top:10px;display:block;text-align:center">↗ Visit</a>` : "";
    return `<div class="map-popup">
      <span class="mp-badge" style="background:${color}22;color:${color};border:1px solid ${color}55">${site.category}</span>
      <div class="mp-name">${site.name}</div>
      <div class="mp-row">${flag} ${site.country}${site.region ? ` · ${site.region}` : ""}</div>
      <div class="mp-row" style="margin-top:4px;line-height:1.5">${desc}</div>
      ${monthsHtml}${visitHtml}
    </div>`;
  }

  // ── Core render ──
  function renderMarkers(force = false) {
    renderMarkersRef.current = renderMarkers;
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const renderKey = JSON.stringify({
      rids: displayRaces.map(r => r.id),
      favs: [...favSet].sort(),
      votes: [...votesByRace.keys()].sort(),
      explore: showExploreRef.current,
      races: showRacesRef.current,
    });
    if (!force && renderKey === lastRenderKeyRef.current) return;
    lastRenderKeyRef.current = renderKey;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // ── Render every race as individual pin ──
    if (showRacesRef.current) displayRaces.forEach(race => {
      const coords = getCoords(race);
      if (!coords) return;
      renderSingleGroup(L, map, { races: [race], coords }, coords);
    });

    // ── Explore site markers ──
    if (showExploreRef.current) {
      sites.forEach(site => {
        if (!site.lat || !site.lng) return;
        const lat = parseFloat(site.lat), lng = parseFloat(site.lng);
        if (isNaN(lat) || isNaN(lng)) return;

        const color = CATEGORY_COLORS[site.category] ?? "#94a3b8";
        const label = site.category.toUpperCase();
        const ph = 10, pv = 5, fontSize = 9, charW = fontSize * 0.65;
        const pillW = Math.round(label.length * charW + ph * 2);
        const pillH = fontSize + pv * 2;
        const totalW = pillW + BADGE_PAD * 2;
        const totalH = pillH + BADGE_PAD * 2;

        const html = `<div style="position:relative;width:${totalW}px;height:${totalH}px;overflow:visible">
          <div style="position:absolute;top:${BADGE_PAD}px;left:${BADGE_PAD}px">${explorePillSvg(label, color)}</div>
        </div>`;
        const icon = L.divIcon({ html, className: "", iconSize: [totalW, totalH], iconAnchor: [totalW / 2, totalH / 2], popupAnchor: [0, -(totalH / 2 + 6)] });
        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup(buildExplorePopup(site), { maxWidth: 280, className: "map-popup-wrapper" });
        markersRef.current.push(marker);
      });
    }
  }

  // ── Render one event group as a pill pin ──
  function renderSingleGroup(L: any, map: any, group: { races: Race[]; coords: [number, number] }, coords: [number, number]) {
    const { races: groupRaces } = group;
    const rep = groupRaces[0];
    const fill = TYPE_COLORS[rep.type] ?? "#6366f1";
    const label = TYPE_LETTERS[rep.type] ?? "?";
    const isFav = groupRaces.some(r => favSet.has(r.id));
    const allVoters = [...new Set(groupRaces.flatMap(r => votesByRace.get(r.id) ?? []))];
    const voteCount = allVoters.length;

    const ph = 11, pv = 6, fontSize = 10, charW = fontSize * 0.62;
    const pillW = Math.round(label.length * charW + ph * 2);
    const pillH = fontSize + pv * 2;
    const totalW = pillW + BADGE_PAD * 2;
    const totalH = pillH + BADGE_PAD * 2;

    const icon = L.divIcon({
      html: raceIconHtml(fill, label, isFav, voteCount, pillW, pillH),
      className: "",
      iconSize: [totalW, totalH],
      iconAnchor: [totalW / 2, totalH / 2],
      popupAnchor: [0, -(totalH / 2 + 8)],
    });

    const marker = L.marker(coords, { icon }).addTo(map);
    marker.bindPopup(buildGroupPopup(groupRaces, isFav, allVoters), { maxWidth: 300, className: "map-popup-wrapper" });
    marker.on("popupopen", () => {
      setTimeout(() => {
        groupRaces.forEach(r => {
          const btn = document.querySelector(`[data-race-id="${r.id}"]`) as HTMLElement;
          const rIsFav = favSet.has(r.id);
          if (btn) btn.onclick = () => { onToggleFav(r.id, rIsFav); map.closePopup(); };
        });
      }, 50);
    });
    markersRef.current.push(marker);
  }

  useEffect(() => { renderMarkers(); }, [displayRaces, sites, favSet, votesByRace, showFavsOnly]);

  // ── Expose recenter function to parent ──
  useEffect(() => {
    if (!recenterRef) return;
    recenterRef.current = () => {
      const L = (window as any).L;
      const map = mapInstanceRef.current;
      if (!L || !map) return;
      const coords = displayRaces
        .map(r => getCoords(r))
        .filter(Boolean) as [number, number][];
      if (coords.length === 0) return;
      if (coords.length === 1) {
        map.setView(coords[0], 6, { animate: true });
      } else {
        const bounds = L.latLngBounds(coords.map(([lat, lng]) => [lat, lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6, animate: true });
      }
    };
  }, [displayRaces, recenterRef]);

  function handleToggleExplore() {
    const next = !showExploreRef.current;
    showExploreRef.current = next;
    setShowExplore(next);
    // If turning Explore OFF while Races is OFF, snap Races back to ON
    if (!next && !showRacesRef.current) {
      showRacesRef.current = true;
      setShowRaces(true);
    }
    renderMarkers(true);
  }

  function handleToggleRaces() {
    if (!showExploreRef.current) return; // locked unless Explore is ON
    const next = !showRacesRef.current;
    showRacesRef.current = next;
    setShowRaces(next);
    renderMarkers(true);
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="map-container w-full" style={{ height: "clamp(420px, 40vw, 450px)", zIndex: 1, touchAction: "pan-y" }} />
      {/* Explore + Races buttons — top-right */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }}>
        <button
          onClick={handleToggleRaces}
          title={!showExplore ? "Enable Explore first" : undefined}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-md transition-all backdrop-blur-sm ${
            !showExplore
              ? "bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
              : showRaces
                ? "bg-white/95 dark:bg-zinc-900/95 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:brightness-110"
                : "bg-white/95 dark:bg-zinc-900/95 border-[1.5px] border-blue-400 text-blue-500 dark:text-blue-400 hover:brightness-110"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {showRaces ? "Races: ON" : "Races: OFF"}
        </button>
        <button
          onClick={handleToggleExplore}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-md transition-all hover:brightness-110 backdrop-blur-sm ${
            showExplore ? "bg-white/95 dark:bg-zinc-900/95 border-[1.5px] border-orange-400 text-orange-500 dark:text-orange-400" : "bg-white/95 dark:bg-zinc-900/95 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {showExplore
            ? <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
          }
          {showExplore ? "Explore: ON" : "Explore: OFF"}
        </button>
      </div>
      {/* Show Predicted + Show Past — bottom-right */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-wrap justify-end gap-1.5" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))", maxWidth: "calc(100% - 60px)" }}>
        <button
          onClick={onToggleUnconfirmed}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-md transition-all hover:brightness-110 backdrop-blur-sm ${
            showUnconfirmed ? "bg-white/95 dark:bg-zinc-900/95 border-[1.5px] border-red-400 text-red-500 dark:text-red-400" : "bg-white/95 dark:bg-zinc-900/95 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {showUnconfirmed ? "Predicted: ON" : "Predicted: OFF"}
        </button>
        <button
          onClick={onToggleHidePast}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-md transition-all hover:brightness-110 backdrop-blur-sm ${
            !hidePast ? "bg-white/95 dark:bg-zinc-900/95 border-[1.5px] border-amber-400 text-amber-500 dark:text-amber-400" : "bg-white/95 dark:bg-zinc-900/95 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300"
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
  );
}
