import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Filter, X, Globe2, Users, AlertTriangle, ChevronRight, TrendingUp, Calendar, MapPin } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import type { Race, Favourite, ExploreSite, ExploreFavourite } from "../../../shared/schema";
import { COUNTRY_WEATHER } from "../lib/raceGeo";
import { getRaceWeather } from "../lib/weatherData";
import { getDistPillClass } from "../lib/distancePills";
import { API_BASE } from "../App";
import MapView from "../components/MapView";
import ExploreSection from "../components/ExploreSection";
import VoterChips from "../components/VoterChips";

const S = "v5:"; // bump this prefix to invalidate all users' localStorage
const STORAGE_KEY = S+"asia-cal-voter";
const STORAGE_RACE_FILTER_OPEN = S+"asia-cal-race-filter-open";
const STORAGE_RACE_FILTER_SECTIONS = S+"asia-cal-race-filter-sections";
const STORAGE_HIDE_PAST = S+"asia-cal-hide-past";
const STORAGE_SHOW_UNCONFIRMED = S+"asia-cal-show-unconfirmed";
const STORAGE_SPORT_FILTERS = S+"asia-cal-sport-filters";
const STORAGE_SUB_FILTERS = S+"asia-cal-sub-filters";
const STORAGE_TEAM_FILTERS = S+"asia-cal-team-filters";
const STORAGE_COUNTRY_FILTERS = S+"asia-cal-country-filters";
const STORAGE_MONTH_FILTERS = S+"asia-cal-month-filters";
const STORAGE_YEAR_FILTERS = S+"asia-cal-year-filters";
const STORAGE_EXPLORE_FILTERS = S+"asia-cal-explore-filters";
const STORAGE_REGION_FILTERS = S+"asia-cal-region-filters";
const STORAGE_CITY_FILTERS = S+"asia-cal-city-filters";
const STORAGE_ACTIVE_SUB_PANEL = S+"asia-cal-active-sub-panel";
const STORAGE_SHOW_FILTER_BAR = S+"asia-cal-show-filter-bar";
const STORAGE_THEME = S+"asia-cal-theme";
const STORAGE_SORT_MODE = S+"asia-cal-sort-mode";

// Extract city = first segment before comma in location
const extractCity = (location: string) => location.split(",")[0].trim();

const REGIONS = [
  {
    value: "southeast-asia",
    label: "Southeast Asia",
    countries: ["Thailand", "Vietnam", "Indonesia", "Malaysia", "Philippines", "Singapore", "Cambodia", "Myanmar", "Laos"],
  },
  {
    value: "east-asia",
    label: "East Asia",
    countries: ["Japan", "South Korea", "China", "Taiwan", "Hong Kong", "Mongolia"],
  },
  {
    value: "south-asia",
    label: "South Asia",
    countries: ["India", "Sri Lanka", "Nepal", "Bhutan", "Maldives"],
  },
  {
    value: "middle-east",
    label: "Middle East",
    countries: ["UAE", "Bahrain", "Oman"],
  },
  {
    value: "oceania",
    label: "Oceania",
    countries: ["New Zealand"],
  },
];

const COUNTRIES = [
  { value: "India", label: "🇮🇳 India" }, { value: "Japan", label: "🇯🇵 Japan" },
  { value: "Thailand", label: "🇹🇭 Thailand" }, { value: "Vietnam", label: "🇻🇳 Vietnam" },
  { value: "Philippines", label: "🇵🇭 Philippines" }, { value: "Indonesia", label: "🇮🇩 Indonesia" },
  { value: "Nepal", label: "🇳🇵 Nepal" }, { value: "Sri Lanka", label: "🇱🇰 Sri Lanka" },
  { value: "Malaysia", label: "🇲🇾 Malaysia" }, { value: "Singapore", label: "🇸🇬 Singapore" },
  { value: "South Korea", label: "🇰🇷 South Korea" }, { value: "China", label: "🇨🇳 China" },
  { value: "Taiwan", label: "🇹🇼 Taiwan" }, { value: "Maldives", label: "🇲🇻 Maldives" },
  { value: "Cambodia", label: "🇰🇭 Cambodia" }, { value: "Myanmar", label: "🇲🇲 Myanmar" },
  { value: "Mongolia", label: "🇲🇳 Mongolia" }, { value: "Bhutan", label: "🇧🇹 Bhutan" },
  { value: "Laos", label: "🇱🇦 Laos" },
  { value: "New Zealand", label: "🇳🇿 New Zealand" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT: Record<string,string> = { January:"Jan",February:"Feb",March:"Mar",April:"Apr",May:"May",June:"Jun",July:"Jul",August:"Aug",September:"Sep",October:"Oct",November:"Nov",December:"Dec" };
const YEARS = ["2026","2027"];
const EXPLORE_CATEGORIES = ["Mountains","Islands","Cities","Temples","Nature","Beaches"];

// ── Race Filter Definitions ──
// Simple sport pills — no sub-filters
const SIMPLE_SPORT_PILLS = [
  { value: "hyrox", label: "Hyrox" },
  { value: "swimrun", label: "SwimRun" },
  { value: "ocr", label: "OCR" },
  { value: "xenom", label: "Xenom" },
];

// All TYPE_LABELS show the sport name only — conditions live separately in the cell.
const TYPE_LABELS: Record<string, string> = {
  "badge-tri":        "Triathlon",
  "badge-run":        "Running",
  "badge-run-trail":  "Running",  // same label, different color
  "badge-hyrox":      "Hyrox",
  "badge-swim":       "Swimming",
  "badge-swimrun":    "SwimRun",
  "badge-trail":      "Running",  // same label, different color
  "badge-ocr":        "OCR",
  "badge-spartan":    "Spartan",
  "badge-xenom":      "Xenom",
  // fallback: type used directly
  "triathlon":  "Triathlon",
  "running":    "Running",
  "trail":      "Running",
  "ocean-swim": "Swimming",
  "swimming":   "Swimming",
  "swimrun":    "SwimRun",
  "hyrox":      "Hyrox",
  "ocr":        "OCR",
  "xenom":      "Xenom",
  "spartan":    "Spartan",
};

// Pills use explicit light/dark colors for readability in both modes.
const PILL_COLORS: Record<string, string> = {
  // Triathlon — blue
  "badge-tri":        "bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/60 dark:text-blue-400",
  // Road running — green
  "badge-run":        "bg-green-100 border-green-500 text-green-700 dark:bg-green-500/15 dark:border-green-500/60 dark:text-green-400",
  // Trail running — amber/brown (distinct from road)
  "badge-run-trail":  "bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-500/15 dark:border-orange-500/60 dark:text-orange-400",
  "badge-trail":      "bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-500/15 dark:border-orange-500/60 dark:text-orange-400",
  // Hyrox — yellow
  "badge-hyrox":      "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-400/15 dark:border-yellow-400/60 dark:text-yellow-400",
  // Swim — cyan
  "badge-swim":       "bg-cyan-100 border-cyan-500 text-cyan-700 dark:bg-cyan-500/15 dark:border-cyan-500/60 dark:text-cyan-400",
  "badge-swimrun":    "bg-teal-100 border-teal-500 text-teal-700 dark:bg-teal-500/15 dark:border-teal-500/60 dark:text-teal-400",
  // OCR — red
  "badge-ocr":        "bg-red-100 border-red-500 text-red-700 dark:bg-red-500/15 dark:border-red-500/60 dark:text-red-400",
  // Spartan (brand OCR) — same red family
  "badge-spartan":    "bg-red-100 border-red-500 text-red-700 dark:bg-red-500/15 dark:border-red-500/60 dark:text-red-400",
  // Xenom — purple
  "badge-xenom":      "bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-500/15 dark:border-purple-500/60 dark:text-purple-400",
  // fallback: type used directly as cls
  "triathlon":   "bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/60 dark:text-blue-400",
  "running":     "bg-green-100 border-green-500 text-green-700 dark:bg-green-500/15 dark:border-green-500/60 dark:text-green-400",
  "trail":       "bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-500/15 dark:border-orange-500/60 dark:text-orange-400",
  "hyrox":       "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-400/15 dark:border-yellow-400/60 dark:text-yellow-400",
  "ocean-swim":  "bg-cyan-100 border-cyan-500 text-cyan-700 dark:bg-cyan-500/15 dark:border-cyan-500/60 dark:text-cyan-400",
  "swimming":    "bg-cyan-100 border-cyan-500 text-cyan-700 dark:bg-cyan-500/15 dark:border-cyan-500/60 dark:text-cyan-400",
  "swimrun":     "bg-teal-100 border-teal-500 text-teal-700 dark:bg-teal-500/15 dark:border-teal-500/60 dark:text-teal-400",
  "ocr":         "bg-red-100 border-red-500 text-red-700 dark:bg-red-500/15 dark:border-red-500/60 dark:text-red-400",
  "spartan":     "bg-red-100 border-red-500 text-red-700 dark:bg-red-500/15 dark:border-red-500/60 dark:text-red-400",
  "xenom":       "bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-500/15 dark:border-purple-500/60 dark:text-purple-400",
};

// Expandable sport sections with distance sub-filters
const SPORT_SECTIONS = [
  {
    key: "triathlon",
    label: "Triathlon",
    types: ["triathlon"],
    subFilters: [
      { value: "tri-sprint", label: "Sprint" },
      { value: "tri-olympic", label: "Olympic" },
      { value: "tri-half", label: "Half IM" },
      { value: "tri-full", label: "IM" },
    ],
  },
  {
    key: "running",
    label: "Running",
    // Road and trail running are both type "running" now, distinguished by venue —
    // see matchesSubFilter's run-road/run-trail handling below.
    types: ["running"],
    subFilters: [
      { value: "run-road", label: "Road" },
      { value: "run-trail", label: "Trail" },
      { value: "run-5k", label: "5K" },
      { value: "run-10k", label: "10K" },
      { value: "run-half", label: "21.1K" },
      { value: "run-marathon", label: "42.2K" },
      { value: "run-50k", label: "50K+" },
      { value: "run-100k", label: "100K+" },
    ],
  },
  {
    key: "swimming",
    label: "Swimming",
    types: ["swimming"],
    subFilters: [
      { value: "swim-2k", label: "2K" },
      { value: "swim-5k", label: "5K" },
      { value: "swim-10k", label: "10K" },
      { value: "swim-10kplus", label: "10K+" },
    ],
  },
];

// Format filter pills — apply across all sports
const TEAM_PILLS = [
  { value: "team-solo", label: "Solo", matches: ["solo"] },
  { value: "team-doubles", label: "Doubles", matches: ["doubles", "team of 2"] },
  { value: "team-relay", label: "Relay", matches: ["relay", "team relay"] },
  { value: "team-teams", label: "Teams", matches: ["doubles", "relay", "team of 2", "team relay", "solo or team", "solo / doubles", "solo / relay", "/ relay", "/ team"] },
];

// Format raw team string into clean display labels
function formatTeamDisplay(team: string): string {
  if (!team) return "";
  const t = team.toLowerCase();
  const parts: string[] = [];
  if (t.includes("solo")) parts.push("Solo");
  if (t.includes("doubles") || t.includes("team of 2")) parts.push("Doubles");
  if (t.includes("relay") || t.includes("team relay")) parts.push("Relay");
  if ((t.includes("solo or team") || t.includes("/ team")) && !parts.includes("Relay") && !parts.includes("Doubles")) parts.push("Team");
  return parts.length > 0 ? parts.join(" · ") : team;
}

function SportPill({ cls }: { cls: string }) {
  const colorClass = PILL_COLORS[cls] ?? "bg-muted border-border text-muted-foreground";
  const label = TYPE_LABELS[cls] ?? cls;
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold border ${colorClass}`}>
      {label}
    </span>
  );
}

// Keep BadgeClass as alias for backward compatibility
function BadgeClass({ cls }: { cls: string }) {
  return <SportPill cls={cls} />;
}

// ── Sub-filter matching helper ──
function matchesSubFilter(race: Race, subKey: string): boolean {
  const d = (race.distance ?? "").toLowerCase();
  const t = (race.team ?? "").toLowerCase();
  const type = (race.type ?? "").toLowerCase();
  const venue = ((race as any).venue ?? "").toLowerCase();

  // Triathlon — match against distanceLabel field
  const dl = ((race as any).distanceLabel ?? "").toLowerCase();
  if (subKey === "tri-full") return dl.includes("im") && !dl.includes("half");
  if (subKey === "tri-half") return dl.includes("half im");
  if (subKey === "tri-olympic") return dl.includes("olympic");
  if (subKey === "tri-sprint") return dl.includes("sprint");

  if (subKey === "run-road") return type === "running" && venue !== "trail";
  if (subKey === "run-trail") return type === "running" && venue === "trail";
  if (subKey === "run-5k") return /\b5k\b/i.test(d) || d.includes("5km");
  if (subKey === "run-10k") return /\b10k\b/i.test(d) || d.includes("10km");
  if (subKey === "run-half") return d.includes("21.1") || d.includes("21k") || d.includes("half marathon");
  if (subKey === "run-marathon") return d.includes("42.2") || d.includes("42k") || (d.includes("marathon") && !d.includes("half"));
  if (subKey === "run-50k") return /\b(50|51|52|53|56|60|68)k\b/i.test(d);
  if (subKey === "run-100k") return /\b(96|97|98|100|101|102|104|116|148|161|168)k\b/i.test(d) || d.includes("100mi");

  if (subKey === "hyrox-solo") return t.includes("solo") && !t.includes("doubles") && !t.includes("relay");
  if (subKey === "hyrox-doubles") return t.includes("doubles");
  if (subKey === "hyrox-relay") return t.includes("relay");

  if (subKey === "swim-2k") return /\b2k\b/i.test(d) || d.includes("2km");
  if (subKey === "swim-5k") return /\b5k\b/i.test(d) || d.includes("5km");
  if (subKey === "swim-10k") return /\b10k\b/i.test(d) || d.includes("10km");
  if (subKey === "swim-10kplus") return /\b(21|25|40)k\b/i.test(d) || d.includes("21km") || d.includes("25km") || d.includes("40km");

  if (subKey === "sr-solo") return t.includes("solo");
  if (subKey === "sr-team") return t.includes("team of 2");

  return false;
}

// ── Sport filter matching for a race ──
// sportFilters = Set of simple pill values (duathlon, adventure) or sport section keys
// subFilters = Set of sub-filter values
function matchesSportFilters(race: Race, sportFilters: Set<string>, subFilters: Set<string>): boolean {
  if (sportFilters.size === 0 && subFilters.size === 0) return true;

  const type = (race.type ?? "").toLowerCase();

  // Check simple pills
  for (const pill of ["hyrox", "swimrun", "ocr", "xenom"]) {
    if (sportFilters.has(pill) && type === pill) return true;
  }

  // Check sport sections
  for (const section of SPORT_SECTIONS) {
    if (!sportFilters.has(section.key) && !section.subFilters.some(sf => subFilters.has(sf.value))) continue;

    const typeMatches = section.types.includes(type);
    if (!typeMatches) continue;

    // Sport selected but no sub-filters for this section → match all
    const sectionSubFiltersActive = section.subFilters.filter(sf => subFilters.has(sf.value));
    if (sportFilters.has(section.key) && sectionSubFiltersActive.length === 0) return true;

    // Sub-filters active → must match at least one
    if (sectionSubFiltersActive.some(sf => matchesSubFilter(race, sf.value))) return true;
  }

  return false;
}

export default function CalendarPage() {
  const qc = useQueryClient();

  // ── Voter name ──
  const [voterName, setVoterName] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
  });
  const [nameInput, setNameInput] = useState("");

  // ── Theme ──
  const [isDark, setIsDark] = useState(() => {
    try { const v = localStorage.getItem(STORAGE_THEME); return v === null ? true : v === "dark"; } catch { return true; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
    try { localStorage.setItem(STORAGE_THEME, isDark ? "dark" : "light"); } catch {}
    // Tint the browser's own UI (address bar / bottom bar on mobile) to match —
    // otherwise it stays whatever color it was on load regardless of theme.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#111318" : "#f3f5f7");
  }, [isDark]);

  // ── UI state ──
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTimeFilters, setShowTimeFilters] = useState(false);
  // activeSubPanel: which sub-panel is open — 'race' | 'locations' | 'dates' | 'explore' | null
  const [activeSubPanel, setActiveSubPanel] = useState<'race' | 'locations' | 'dates' | 'explore' | null>(() => {
    try { const v = localStorage.getItem(STORAGE_ACTIVE_SUB_PANEL); return (v === 'race' || v === 'locations' || v === 'dates' || v === 'explore') ? v : 'race'; } catch { return 'race'; }
  });
  // showFilterBar: whether the second row is visible
  const [showFilterBar, setShowFilterBar] = useState(() => {
    try { return localStorage.getItem(STORAGE_SHOW_FILTER_BAR) === 'true'; } catch { return false; }
  });
  const [showSearch, setShowSearch] = useState(false);
  const [showRaceList, setShowRaceList] = useState(true);
  const [showFavs, setShowFavs] = useState(false);
  const [sortMode, setSortMode] = useState<"date" | "votes">(() => {
    try { return (localStorage.getItem(STORAGE_SORT_MODE) as any) ?? "date"; } catch { return "date"; }
  });
  // Date range filter: { from, to } — undefined means no range selected
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const prevFilters = useRef<any>(null);

  // ── Race Filters panel state (localStorage persisted) ──
  const [raceFilterOpen, setRaceFilterOpen] = useState(() => {
    try { return localStorage.getItem(STORAGE_RACE_FILTER_OPEN) === "true"; } catch { return false; }
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RACE_FILTER_SECTIONS);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // ── Show Unconfirmed toggle ──
  const [showUnconfirmed, setShowUnconfirmed] = useState(() => {
    try { const v = localStorage.getItem(STORAGE_SHOW_UNCONFIRMED); return v === null ? true : v === "true"; } catch { return true; }
  });

  // ── Hide past races toggle (default: true = hide past) ──
  const [hidePast, setHidePast] = useState(() => {
    try { const v = localStorage.getItem(STORAGE_HIDE_PAST); return v === null ? true : v === "true"; } catch { return true; }
  });

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_RACE_FILTER_OPEN, String(raceFilterOpen)); } catch {}
  }, [raceFilterOpen]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_RACE_FILTER_SECTIONS, JSON.stringify([...expandedSections])); } catch {}
  }, [expandedSections]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_SHOW_UNCONFIRMED, String(showUnconfirmed)); } catch {}
  }, [showUnconfirmed]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_HIDE_PAST, String(hidePast)); } catch {}
  }, [hidePast]);

  // ── Filters (all persisted to localStorage) ──
  const [sportFilters, setSportFilters] = useState<Set<string>>(() => {
    try { const v = localStorage.getItem(STORAGE_SPORT_FILTERS); return v ? new Set(JSON.parse(v)) : new Set(); } catch { return new Set(); }
  });
  const [subFilters, setSubFilters] = useState<Set<string>>(() => {
    try { const v = localStorage.getItem(STORAGE_SUB_FILTERS); return v ? new Set(JSON.parse(v)) : new Set(); } catch { return new Set(); }
  });
  const [teamFilters, setTeamFilters] = useState<Set<string>>(() => {
    try { const v = localStorage.getItem(STORAGE_TEAM_FILTERS); return v ? new Set(JSON.parse(v)) : new Set(); } catch { return new Set(); }
  });
  const [countryFilters, setCountryFilters] = useState<string[]>(() => {
    try { const v = localStorage.getItem(STORAGE_COUNTRY_FILTERS); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [monthFilters, setMonthFilters] = useState<string[]>(() => {
    try { const v = localStorage.getItem(STORAGE_MONTH_FILTERS); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [yearFilters, setYearFilters] = useState<string[]>(() => {
    try { const v = localStorage.getItem(STORAGE_YEAR_FILTERS); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [exploreCategoryFilters, setExploreCategoryFilters] = useState<string[]>(() => {
    try { const v = localStorage.getItem(STORAGE_EXPLORE_FILTERS); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [regionFilters, setRegionFilters] = useState<string[]>(() => {
    try { const v = localStorage.getItem(STORAGE_REGION_FILTERS); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [cityFilters, setCityFilters] = useState<string[]>(() => {
    try { const v = localStorage.getItem(STORAGE_CITY_FILTERS); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [minVotesFilter, setMinVotesFilter] = useState(false);
  const [search, setSearch] = useState("");

  // ── Persist all filters to localStorage ──
  useEffect(() => { try { localStorage.setItem(STORAGE_ACTIVE_SUB_PANEL, activeSubPanel ?? 'race'); } catch {} }, [activeSubPanel]);
  useEffect(() => { try { localStorage.setItem(STORAGE_SHOW_FILTER_BAR, String(showFilterBar)); } catch {} }, [showFilterBar]);


  useEffect(() => { try { localStorage.setItem(STORAGE_SPORT_FILTERS, JSON.stringify([...sportFilters])); } catch {} }, [sportFilters]);
  useEffect(() => { try { localStorage.setItem(STORAGE_SUB_FILTERS, JSON.stringify([...subFilters])); } catch {} }, [subFilters]);
  useEffect(() => { try { localStorage.setItem(STORAGE_TEAM_FILTERS, JSON.stringify([...teamFilters])); } catch {} }, [teamFilters]);
  useEffect(() => { try { localStorage.setItem(STORAGE_COUNTRY_FILTERS, JSON.stringify(countryFilters)); } catch {} }, [countryFilters]);
  useEffect(() => { try { localStorage.setItem(STORAGE_MONTH_FILTERS, JSON.stringify(monthFilters)); } catch {} }, [monthFilters]);
  useEffect(() => { try { localStorage.setItem(STORAGE_YEAR_FILTERS, JSON.stringify(yearFilters)); } catch {} }, [yearFilters]);
  useEffect(() => { try { localStorage.setItem(STORAGE_EXPLORE_FILTERS, JSON.stringify(exploreCategoryFilters)); } catch {} }, [exploreCategoryFilters]);
  useEffect(() => { try { localStorage.setItem(STORAGE_REGION_FILTERS, JSON.stringify(regionFilters)); } catch {} }, [regionFilters]);
  useEffect(() => { try { localStorage.setItem(STORAGE_CITY_FILTERS, JSON.stringify(cityFilters)); } catch {} }, [cityFilters]);
  useEffect(() => { try { localStorage.setItem(STORAGE_SORT_MODE, sortMode); } catch {} }, [sortMode]);

  // ── Data ──
  const { data: races = [], isLoading } = useQuery<Race[]>({ queryKey: ["/api/races"] });
  const { data: favourites = [] } = useQuery<Favourite[]>({ queryKey: ["/api/favourites"] });
  const { data: exploreSites = [] } = useQuery<ExploreSite[]>({ queryKey: ["/api/explore"] });
  const { data: exploreFavourites = [] } = useQuery<ExploreFavourite[]>({ queryKey: ["/api/explore-favourites"] });

  const addFav = useMutation({
    mutationFn: async (raceId: number) => {
      await fetch(`${API_BASE}/api/favourites`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raceId, voterName }) });
    },
    onMutate: async (raceId) => {
      await qc.cancelQueries({ queryKey: ["/api/favourites"] });
      const prev = qc.getQueryData<Favourite[]>(["/api/favourites"]) ?? [];
      qc.setQueryData(["/api/favourites"], [...prev, { id: Date.now(), raceId, voterName }]);
      return { prev };
    },
    onError: (_e, _v, ctx: any) => qc.setQueryData(["/api/favourites"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["/api/favourites"] }),
  });

  const removeFav = useMutation({
    mutationFn: async (raceId: number) => {
      await fetch(`${API_BASE}/api/favourites/${raceId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voterName }) });
    },
    onMutate: async (raceId) => {
      await qc.cancelQueries({ queryKey: ["/api/favourites"] });
      const prev = qc.getQueryData<Favourite[]>(["/api/favourites"]) ?? [];
      qc.setQueryData(["/api/favourites"], prev.filter(f => !(f.raceId === raceId && f.voterName === voterName)));
      return { prev };
    },
    onError: (_e, _v, ctx: any) => qc.setQueryData(["/api/favourites"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["/api/favourites"] }),
  });

  const favSet = useMemo(() => new Set(
    favourites.filter(f => f.voterName === voterName).map(f => f.raceId)
  ), [favourites, voterName]);

  const votesByRace = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const f of favourites) {
      if (!m.has(f.raceId)) m.set(f.raceId, []);
      m.get(f.raceId)!.push(f.voterName);
    }
    return m;
  }, [favourites]);

  const addExploreFav = useMutation({
    mutationFn: async (exploreSiteId: number) => {
      await fetch(`${API_BASE}/api/explore-favourites`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exploreSiteId, voterName }) });
    },
    onMutate: async (exploreSiteId) => {
      await qc.cancelQueries({ queryKey: ["/api/explore-favourites"] });
      const prev = qc.getQueryData<ExploreFavourite[]>(["/api/explore-favourites"]) ?? [];
      qc.setQueryData(["/api/explore-favourites"], [...prev, { id: Date.now(), exploreSiteId, voterName }]);
      return { prev };
    },
    onError: (_e, _v, ctx: any) => qc.setQueryData(["/api/explore-favourites"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["/api/explore-favourites"] }),
  });

  const removeExploreFav = useMutation({
    mutationFn: async (exploreSiteId: number) => {
      await fetch(`${API_BASE}/api/explore-favourites/${exploreSiteId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voterName }) });
    },
    onMutate: async (exploreSiteId) => {
      await qc.cancelQueries({ queryKey: ["/api/explore-favourites"] });
      const prev = qc.getQueryData<ExploreFavourite[]>(["/api/explore-favourites"]) ?? [];
      qc.setQueryData(["/api/explore-favourites"], prev.filter(f => !(f.exploreSiteId === exploreSiteId && f.voterName === voterName)));
      return { prev };
    },
    onError: (_e, _v, ctx: any) => qc.setQueryData(["/api/explore-favourites"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["/api/explore-favourites"] }),
  });

  const exploreFavSet = useMemo(() => new Set(
    exploreFavourites.filter(f => f.voterName === voterName).map(f => f.exploreSiteId)
  ), [exploreFavourites, voterName]);

  // Collective votes for Explore sites — every voterName who's starred a place, same
  // shape and same "favouriting IS voting" relationship votesByRace already has for
  // races. exploreFavSet above stays personal-only (this user's own stars, for "My
  // Favourites"); this is the all-voters aggregate that "Most Voted" reads from.
  const exploreVotesBySite = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const f of exploreFavourites) {
      if (!m.has(f.exploreSiteId)) m.set(f.exploreSiteId, []);
      m.get(f.exploreSiteId)!.push(f.voterName);
    }
    return m;
  }, [exploreFavourites]);

  const allVoters = useMemo(() => [...new Set(favourites.map(f => f.voterName))].sort(), [favourites]);

  // ── Sport filter helpers ──
  function toggleSportPill(key: string) {
    setSportFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleSubFilter(val: string) {
    setSubFilters(prev => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val); else next.add(val);
      return next;
    });
  }

  function toggleTeamFilter(val: string) {
    setTeamFilters(prev => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val); else next.add(val);
      return next;
    });
  }

  function toggleSection(key: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // ── Computed: is Race Filters active? ──
  const raceFiltersActive = sportFilters.size > 0 || subFilters.size > 0 || teamFilters.size > 0;

  // ── Active filter count (for display) ──
  const activeFilterCount = useMemo(() => {
    let n = 0;
    n += sportFilters.size + subFilters.size + teamFilters.size;
    n += countryFilters.length + monthFilters.length + yearFilters.length + exploreCategoryFilters.length + cityFilters.length;
    if (personFilter) n++;
    if (minVotesFilter) n++;
    if (search) n++;
    if (dateRange.from || dateRange.to) n++;
    return n;
  }, [sportFilters, subFilters, teamFilters, countryFilters, monthFilters, yearFilters, personFilter, minVotesFilter, exploreCategoryFilters, search, dateRange]);

  // ── Clear all filters ──
  const clearAll = useCallback(() => {
    setSportFilters(new Set());
    setSubFilters(new Set());
    setTeamFilters(new Set());
    setCountryFilters([]);
    setCityFilters([]);
    setMonthFilters([]);
    setYearFilters([]);
    setPersonFilter(null);
    setMinVotesFilter(false);
    setExploreCategoryFilters([]);
    setRegionFilters([]);
    setSearch("");
    setDateRange({ from: undefined, to: undefined });
    setShowFilters(false);
    setShowTimeFilters(false);
    setRaceFilterOpen(false);
    setActiveSubPanel('race');
  }, []);

  // Shared by the header's own Filters button and the floating map-overlay Filters
  // button shown in fullscreen (the header itself is hidden there).
  const handleToggleFilterBar = useCallback(() => {
    setShowFilterBar(v => {
      if (!v) {
        if (!activeSubPanel) setActiveSubPanel("race");
        setExpandedSections(new Set());
      }
      return !v;
    });
  }, [activeSubPanel]);

  // Shared by the header's Favourites button and the floating map-overlay one shown
  // in fullscreen.
  const handleToggleFavs = useCallback(() => {
    if (!showFavs) {
      prevFilters.current = { sportFilters: new Set(sportFilters), subFilters: new Set(subFilters), teamFilters: new Set(teamFilters), countryFilters, monthFilters, yearFilters, personFilter, minVotesFilter, exploreCategoryFilters };
      setSportFilters(new Set()); setSubFilters(new Set()); setTeamFilters(new Set());
      setCountryFilters([]); setCityFilters([]); setMonthFilters([]); setYearFilters([]); setHidePast(true);
      setPersonFilter(null); setMinVotesFilter(false); setExploreCategoryFilters([]);
      setSortMode("date"); // reset Most Voted when entering Favourites
      setShowFavs(true);
    } else {
      setShowFavs(false);
      if (prevFilters.current) {
        const p = prevFilters.current;
        setSportFilters(p.sportFilters); setSubFilters(p.subFilters); setTeamFilters(p.teamFilters ?? new Set());
        setCountryFilters(p.countryFilters); setMonthFilters(p.monthFilters);
        setYearFilters(p.yearFilters); setPersonFilter(p.personFilter);
        setMinVotesFilter(p.minVotesFilter); setExploreCategoryFilters(p.exploreCategoryFilters);
        prevFilters.current = null;
      }
    }
  }, [showFavs, sportFilters, subFilters, teamFilters, countryFilters, monthFilters, yearFilters, personFilter, minVotesFilter, exploreCategoryFilters]);

  // Shared by the header's Most Voted button and the floating map-overlay one shown
  // in fullscreen.
  const handleToggleMostVoted = useCallback(() => {
    setSortMode(m => m === "votes" ? "date" : "votes");
    setShowFavs(false);
  }, []);

  // ── Individual toggle helpers ──
  // ── Region helpers ──
  function getRegionState(region: typeof REGIONS[0]): 'all' | 'partial' | 'none' {
    const selected = region.countries.filter(c => countryFilters.includes(c));
    if (selected.length === 0) return 'none';
    if (selected.length === region.countries.length) return 'all';
    return 'partial';
  }

  function toggleRegion(regionValue: string) {
    const region = REGIONS.find(r => r.value === regionValue);
    if (!region) return;
    const allSelected = region.countries.every(c => countryFilters.includes(c));
    if (allSelected) {
      setCountryFilters(p => p.filter(c => !region.countries.includes(c)));
      setRegionFilters(p => p.filter(r => r !== regionValue));
    } else {
      setCountryFilters(p => {
        const next = [...p];
        for (const c of region.countries) { if (!next.includes(c)) next.push(c); }
        return next;
      });
      setRegionFilters(p => p.includes(regionValue) ? p : [...p, regionValue]);
    }
  }

  function toggleCountry(v: string) { setCountryFilters(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]); }
  function toggleMonth(v: string) { setMonthFilters(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]); }
  function toggleYear(v: string) { setYearFilters(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]); }
  function toggleExploreCategory(v: string) { setExploreCategoryFilters(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]); }

  // ── Fuzzy date parser: handles "Jan 9, 2026", "Jan 9–10, 2026", "May 28-Jun 6, 2026", "Nov 2027" ──
  function parseFuzzyDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    // Strip junk suffixes and normalize before matching
    let s = dateStr.trim();
    // "TBC YYYY" → Jan 1 YYYY
    const tbcYear = s.match(/^TBC\s+(\d{4})$/);
    if (tbcYear) return new Date(parseInt(tbcYear[1]), 0, 1);
    // Strip parenthetical junk: "(TBC)", "(exact TBC)", "(early)", "(late)" etc.
    s = s.replace(/\s*\(.*?\)/g, '').trim();
    // Strip "pattern / YYYY TBC" and similar tail garbage
    s = s.replace(/\s*pattern\s*\/.*$/i, '').trim();
    s = s.replace(/\s*\/\s*\d{4}.*$/i, '').trim();
    // "Sep/Oct YYYY" → take second month "Oct YYYY"
    const slashMonth = s.match(/^[A-Za-z]{3}\/([A-Za-z]{3})\s+(\d{4})$/);
    if (slashMonth) s = `${slashMonth[1]} ${slashMonth[2]}`;
    // Standard: "Jan 12, 2026"
    const std = s.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
    if (std) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    // Range same month: "Jan 9–10, 2026" or "Jan 9-10, 2026"
    const sameMonth = s.match(/^([A-Za-z]{3})\s+(\d{1,2})[\u2013\-]\d{1,2},?\s*(\d{4})$/);
    if (sameMonth) {
      const d = new Date(`${sameMonth[1]} ${sameMonth[2]}, ${sameMonth[3]}`);
      return isNaN(d.getTime()) ? null : d;
    }
    // Cross-month range: "May 28-Jun 6, 2026"
    const crossMonth = s.match(/^([A-Za-z]{3})\s+(\d{1,2})[\u2013\-][A-Za-z]{3}\s+\d{1,2},?\s*(\d{4})$/);
    if (crossMonth) {
      const d = new Date(`${crossMonth[1]} ${crossMonth[2]}, ${crossMonth[3]}`);
      return isNaN(d.getTime()) ? null : d;
    }
    // Month + year only: "Nov 2027", "Feb 2027" (after stripping parens above)
    const monthYear = s.match(/^([A-Za-z]{3})\s+(\d{4})$/);
    if (monthYear) {
      const d = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
      return isNaN(d.getTime()) ? null : d;
    }
    // Year only: "2027"
    const yearOnly = s.match(/^(\d{4})$/);
    if (yearOnly) return new Date(parseInt(yearOnly[1]), 0, 1);
    // Fallback
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // ── Filtering ──
  const filtered = useMemo(() => {
    return races.filter(r => {
      // Hide watchlist (unconfirmed) unless toggle is on
      if (!showUnconfirmed && r.status === "watchlist") return false;
      // Hide past races unless:
      //   a) toggle is off, OR
      //   b) user explicitly selected a specific year (they want to see ALL of that year)
      const userPickedYear = yearFilters.length > 0;
      if (hidePast && !userPickedYear) {
        const today = new Date(); today.setHours(0,0,0,0);
        let earliest: Date | null = null;
        try {
          const ds: {date:string,status:string}[] = JSON.parse((r as any).dates ?? "[]");
          const allD = ds.length > 0 ? ds.map(d => d.date) : [r.date];
          for (const d of allD) {
            const parsed = parseFuzzyDate(d);
            if (parsed && (earliest === null || parsed < earliest)) earliest = parsed;
          }
        } catch {}
        if (earliest === null) earliest = parseFuzzyDate(r.date);
        if (earliest !== null && earliest < today) return false;
      }
      if (showFavs && !favSet.has(r.id)) return false;
      if (sortMode === "votes" && (votesByRace.get(r.id) ?? []).length === 0) return false;
      if (raceFiltersActive && !matchesSportFilters(r, sportFilters, subFilters)) return false;
      if (teamFilters.size > 0) {
        const t = (r.team ?? "").toLowerCase();
        const matched = [...teamFilters].some(tf => {
          if (tf === "team-solo") return t.includes("solo");
          if (tf === "team-doubles") return t.includes("doubles") || t.includes("team of 2") || t.includes("solo or team") || t.includes("solo / doubles / relay") || t.includes("solo / team of 2");
          if (tf === "team-relay") return t.includes("relay") || t.includes("solo or team") || t.includes("solo / doubles / relay") || t.includes("solo / team relay");
          if (tf === "team-teams") return t.includes("doubles") || t.includes("relay") || t.includes("team of 2") || t.includes("team relay") || t.includes("solo or team") || t.includes("solo / doubles") || t.includes("solo / relay") || t.includes("/ team") || t.includes("solo / doubles / relay");
          return false;
        });
        if (!matched) return false;
      }
      if (countryFilters.length > 0 && !countryFilters.includes(r.country)) return false;
      if (cityFilters.length > 0 && !cityFilters.includes(extractCity(r.location))) return false;
      if (monthFilters.length > 0 && !monthFilters.some(m => r.date.includes(m) || r.date.includes(MONTH_SHORT[m] ?? m))) return false;
      if (yearFilters.length > 0) {
        // Check against the dates array (multi-year races) OR the primary date
        let rDates: {date: string, status: string}[] = [];
        try { rDates = JSON.parse((r as any).dates ?? "[]"); } catch {}
        const allDates = rDates.length > 0 ? rDates.map(d => d.date) : [r.date];
        if (!yearFilters.some(y => allDates.some(d => d.includes(y)))) return false;
      }
      if (personFilter) {
        const voters = votesByRace.get(r.id) ?? [];
        if (!voters.includes(personFilter)) return false;
      }
      if (minVotesFilter) {
        const voters = votesByRace.get(r.id) ?? [];
        if (voters.length < 2) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.location.toLowerCase().includes(q) && !r.country.toLowerCase().includes(q)) return false;
      }
      // Date range filter
      if (dateRange.from || dateRange.to) {
        let rDates: {date: string, status: string}[] = [];
        try { rDates = JSON.parse((r as any).dates ?? "[]"); } catch {}
        const allD = rDates.length > 0 ? rDates.map(d => d.date) : [r.date];
        const parsed = allD.map(d => parseFuzzyDate(d)).filter((d): d is Date => d !== null);
        if (parsed.length === 0) return false;
        const earliest = new Date(Math.min(...parsed.map(d => d.getTime())));
        if (dateRange.from && earliest < dateRange.from) return false;
        if (dateRange.to) { const to = new Date(dateRange.to); to.setHours(23,59,59,999); if (earliest > to) return false; }
      }
      return true;
    });
  }, [races, sportFilters, subFilters, teamFilters, countryFilters, cityFilters, monthFilters, yearFilters, showFavs, favSet, personFilter, minVotesFilter, votesByRace, search, showUnconfirmed, raceFiltersActive, hidePast, dateRange, sortMode]);

  // ── Sorted + filtered races (year-aware sort key, or vote count) ──
  const sortedFiltered = useMemo(() => {
    const getSortKey = (r: any): number => {
      try {
        const ds: {date: string, status: string}[] = JSON.parse((r as any).dates ?? "[]");
        const allD = ds.length > 0 ? ds.map(d => d.date) : [r.date];
        const yearSet = yearFilters.length > 0 ? new Set(yearFilters) : null;
        const candidates = allD.filter(d => yearSet === null || [...yearSet].some(y => d.includes(y)));
        const toSearch = candidates.length > 0 ? candidates : allD;
        const parsed = toSearch.map(d => parseFuzzyDate(d)).filter((d): d is Date => d !== null);
        if (parsed.length > 0) return Math.min(...parsed.map(d => d.getTime()));
      } catch {}
      const fallback = parseFuzzyDate(r.date);
      return fallback ? fallback.getTime() : 0;
    };
    if (sortMode === "votes") {
      return [...filtered].sort((a, b) => {
        const va = (votesByRace.get(b.id) ?? []).length;
        const vb = (votesByRace.get(a.id) ?? []).length;
        if (va !== vb) return va - vb; // desc by votes
        return getSortKey(a) - getSortKey(b); // then asc by date
      });
    }
    return [...filtered].sort((a, b) => getSortKey(a) - getSortKey(b));
  }, [filtered, yearFilters, sortMode, votesByRace]);

  // Countries present in filtered races (for side quest sync)
  const filteredRaceCountries = useMemo(() => new Set(filtered.map(r => r.country)), [filtered]);

  const filteredExploreSites = useMemo(() => {
    const anyRaceFilterActive = raceFiltersActive || monthFilters.length > 0 || yearFilters.length > 0
      || countryFilters.length > 0 || cityFilters.length > 0 || !!personFilter || minVotesFilter;

    const result = exploreSites.filter(s => {
      if (showFavs) {
        // My Votes ON: only places this user has directly voted for — no more
        // country-level proxy (places in a country with a voted race). My Votes
        // shows exactly what was selected, nothing inferred from race location.
        if (!exploreFavSet.has(s.id)) return false;
      } else if (sortMode === "votes") {
        // Most Voted ON: only places someone has actually starred — a direct,
        // collective vote count per place, same as how races already work, not a
        // country-level proxy off of voted races.
        if ((exploreVotesBySite.get(s.id) ?? []).length === 0) return false;
      }
      // All other states (Most Voted OFF, no votes yet, race filters active):
      // show all 255 explore sites — race filters don't bleed into Explore
      if (exploreCategoryFilters.length > 0 && !exploreCategoryFilters.includes(s.category)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.country.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    if (sortMode === "votes" && !showFavs) {
      return [...result].sort((a, b) =>
        (exploreVotesBySite.get(b.id)?.length ?? 0) - (exploreVotesBySite.get(a.id)?.length ?? 0)
      );
    }
    return result;
  }, [exploreSites, showFavs, exploreFavSet, sortMode, exploreVotesBySite, exploreCategoryFilters, search]);

  // ── Header height measurement ──
  const headerRef = useRef<HTMLElement>(null);
  const racesHeaderRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapRecenterRef = useRef<(() => void) | null>(null);
  const [showBackToMap, setShowBackToMap] = useState(false);

  // Recenter the map whenever Favourites-only or Most-Voted is toggled, so the
  // viewport reframes to fit whatever pins are now showing instead of staying on
  // the previous (possibly unrelated) bounds. Skips the very first run — on mount,
  // MapController already does its own initial fitBounds, so re-running here too
  // would just animate a redundant identical fit. Relies on MapController's own
  // effect (deps on displayRaces) having already refreshed recenterRef.current with
  // the new filtered bounds before this effect runs — child effects flush before
  // parent effects in the same commit, so that ordering is guaranteed.
  const didInitialRecenterRef = useRef(false);
  useEffect(() => {
    if (!didInitialRecenterRef.current) { didInitialRecenterRef.current = true; return; }
    mapRecenterRef.current?.();
  }, [showFavs, sortMode]);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    document.documentElement.style.setProperty("--header-h", el.offsetHeight + "px");
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--header-h", el.offsetHeight + "px");
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The floating filters/search panel is only mounted while open, so its own height
  // needs to be (re)measured whenever it mounts/unmounts — map buttons use this (added
  // to --header-h) to know how far down to sit, in both fullscreen and embedded mode.
  useEffect(() => {
    const el = filterPanelRef.current;
    if (!el) {
      document.documentElement.style.setProperty("--filter-panel-h", "0px");
      return;
    }
    document.documentElement.style.setProperty("--filter-panel-h", el.offsetHeight + "px");
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--filter-panel-h", el.offsetHeight + "px");
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [showFilterBar, showSearch, activeFilterCount]);

  useEffect(() => {
    const el = racesHeaderRef.current;
    if (!el) return;
    document.documentElement.style.setProperty("--races-header-h", el.offsetHeight + "px");
    const ro = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--races-header-h", el.offsetHeight + "px");
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fullscreen map: lock page scroll and allow Escape to exit. overflow:hidden
  // alone doesn't stop iOS Safari's elastic rubber-band bounce on touchmove, which
  // otherwise drags the whole page along with a 1-finger pan on the map — locking
  // both html and body, and setting touch-action:none on body specifically (not the
  // map container, which manages its own via Leaflet), stops that without affecting
  // Leaflet's own JS-driven panning on the map element itself.
  useEffect(() => {
    if (!isMapFullscreen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setIsMapFullscreen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMapFullscreen]);

  // ── Back to Map floating button observer ──
  useEffect(() => {
    const el = mapWrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowBackToMap(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Name entry ──
  if (!voterName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <img src="/logo.jpg" alt="Adventure Crew" className="w-16 h-16 rounded-full mx-auto object-cover" />
          <h1 className="text-2xl font-bold text-foreground leading-tight" style={{ fontFamily: "Cabinet Grotesk, sans-serif" }}>Asia Adventures</h1>
          <p className="text-sm text-muted-foreground">Enter your name to star events and vote with friends.</p>
          <input
            type="text"
            placeholder="Your name"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && nameInput.trim()) { const n = nameInput.trim().replace(/^\w/, c => c.toUpperCase()); try { localStorage.setItem(STORAGE_KEY, n); } catch {} setVoterName(n); }}}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-base outline-none focus:border-primary"
            autoFocus
            autoCapitalize="words"
            style={{ fontSize: "16px" }}
          />
          <button
            onClick={() => { if (nameInput.trim()) { const n = nameInput.trim().replace(/^\w/, c => c.toUpperCase()); try { localStorage.setItem(STORAGE_KEY, n); } catch {} setVoterName(n); }}}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const COL_WIDTHS = [40, 200, 0, 0, 0, 0, 0, 0]; // 0 = flex to content

  // ── Date formatter: "Jan 12, 2026" → "Sun · 12 Jan · 2026" ──
  function formatRaceDate(dateStr: string): string {
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const m = dateStr.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
    if (!m) return dateStr;
    const [, mon, day, year] = m;
    const monthIdx = months[mon];
    if (monthIdx === undefined) return dateStr;
    const date = new Date(parseInt(year), monthIdx, parseInt(day));
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    return `${dayOfWeek} · ${day} ${mon} · ${year}`;
  }

  // ── Active filter pill label helpers ──
  // ── Sport column: pill + condition tag ──
  // Condition = surface / venue / brand modifier shown below the SportPill.
  // Priority order within each type: brand > surface > default.
  // `venue` is the real database column now (running/triathlon: road|trail, swimming:
  // ocean|lake|river, ocr: urban|nature) — prefer it, falling back to the old name-based
  // heuristics only when it's missing (shouldn't normally happen post-migration).
  function getSportCondition(type: string, venue: string | null | undefined, raceName: string): string | null {
    const n = (raceName ?? "").toLowerCase();
    const v = (venue ?? "").toLowerCase();
    switch (type) {
      case "running": {
        if (v === "trail") {
          if (n.includes("skyrace") || n.includes("skyrun") || n.includes("sky run") || n.includes("skyultra") || n.includes("sky camp")) return "Skyrun";
          if (n.includes("xterra")) return "Xterra";
          if (n.includes("utmb") || n.includes("ultra-trail") || n.includes("ultra trail")) return "UTMB";
          if (n.includes("spartan")) return "Spartan";
          return "Trail";
        }
        // Sky races
        if (n.includes("skyrace") || n.includes("skyrun") || n.includes("sky run") || n.includes("skyultra")) return "Skyrun";
        // All road marathons / half marathons / 10K etc
        return "Road";
      }
      case "triathlon": {
        if (n.includes("xterra")) return "Xterra";
        return v === "trail" ? "Trail" : "Road";
      }
      case "swimming": {
        if (v === "lake" || n.includes("lake") || n.includes("sun moon")) return "Lake";
        if (v === "river" || n.includes("river")) return "River";
        return "Ocean";
      }
      case "swimrun": {
        if (n.includes("ocean") || n.includes("sea") || n.includes("coast") || n.includes("bay") || n.includes("island")) return "Ocean";
        if (n.includes("lake")) return "Lake";
        if (n.includes("river")) return "River";
        return null; // no Multi — if venue unknown, show nothing
      }
      case "hyrox":
        return "Stadium";
      case "ocr": {
        if (v === "urban") return "Urban";
        if (v === "nature") return "Nature";
        // Fallback heuristic if venue is somehow unset
        if (
          n.includes("trail") || n.includes("mountain") || n.includes("fuji") ||
          n.includes("park") || n.includes("ranch") || n.includes("forest") ||
          n.includes("peak") || n.includes("ivory rock") || n.includes("chiang") ||
          n.includes("chongli") || n.includes("niigata") || n.includes("oita") ||
          n.includes("lakes entrance") || n.includes("shepparton") ||
          n.includes("kawasaki") || n.includes("cavite") || n.includes("sto.") ||
          n.includes("susono") || n.includes("pasig") || n.includes("pattaya") ||
          n.includes("werribee") || n.includes("myoko") || n.includes("singha")
        ) return "Nature";
        if (
          n.includes("stadion") || n.includes("citywalk") || n.includes("deka") ||
          n.includes("kids") || n.includes("singapore") || n.includes("wollongong")
        ) return "Urban";
        return "Nature";
      }
      case "xenom":
        return "Stadium";
      default:
        return null;
    }
  }

  function getSportLabel(key: string): string {
    const pill = SIMPLE_SPORT_PILLS.find(p => p.value === key);
    if (pill) return pill.label;
    const section = SPORT_SECTIONS.find(s => s.key === key);
    return section?.label ?? key;
  }
  function getSubFilterLabel(val: string): string {
    for (const s of SPORT_SECTIONS) {
      const sf = s.subFilters.find(f => f.value === val);
      if (sf) return `${s.label}: ${sf.label}`;
    }
    return val;
  }

  // Whether the floating filters/search panel is currently mounted — used both to
  // decide whether to render it and to suppress the header's own bottom border while
  // it's open, since that border otherwise shows through as a stray line right above
  // the panel (the panel is fixed and anchored exactly at the header's bottom edge).
  const filterPanelOpen = showFilterBar || showSearch || activeFilterCount > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header — just branding + name chip now. Filters/View/Search live
          on the map itself in both modes (see MapView's floating button cluster), and
          the filter tabs/sub-panels/chips float as their own overlay below this via
          filterPanelRef, instead of living inline here. ── */}
      <header ref={headerRef} className={`${isMapFullscreen ? "fixed inset-x-0" : "sticky"} top-0 z-[500] bg-background/95 backdrop-blur-sm ${!isMapFullscreen && !filterPanelOpen ? "border-b border-border" : ""}`}>
        {/* Mobile: two-row layout (hidden on sm+) — hidden entirely while fullscreen */}
        {!isMapFullscreen && (
        <div className="sm:hidden">
          {/* Mobile: Logo + title + name chip */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <img src="/logo.jpg" alt="Adventure Crew" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground leading-tight" style={{ fontFamily: "Cabinet Grotesk, sans-serif" }}>Asia Adventures</h1>
              <p className="text-[13px] text-foreground/80 truncate font-medium tracking-wide">We Take Fun Seriously</p>
            </div>
            {voterName && (
              <div className="ml-auto flex items-center gap-1.5 px-3 h-9 rounded-full border border-primary/40 bg-primary/10 text-xs font-semibold text-primary shrink-0">
                <Users size={12} />
                <span>{voterName}</span>
              </div>
            )}
          </div>
        </div>
        )}{/* end mobile rows */}

        {/* Desktop: single-row layout (hidden on mobile, visible sm+) — hidden while fullscreen */}
        {!isMapFullscreen && (
        <div className="hidden sm:flex items-center gap-3 px-4 py-3">
          {/* Logo + title */}
          <img src="/logo.jpg" alt="Adventure Crew" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          <div className="min-w-0 mr-2">
            <h1 className="text-xl font-bold text-foreground leading-tight" style={{ fontFamily: "Cabinet Grotesk, sans-serif" }}>Asia Adventures</h1>
            <p className="text-sm text-foreground/80 font-medium tracking-wide">We Take Fun Seriously</p>
          </div>
          {/* Right: Lukas chip */}
          <div className="ml-auto flex items-center gap-2">
            {voterName && (
              <div className="flex items-center gap-1.5 px-3 h-8 rounded-full border border-primary/40 bg-primary/10 text-xs font-semibold text-primary shrink-0">
                <Users size={12} />
                <span>{voterName}</span>
              </div>
            )}
          </div>
        </div>
        )}{/* end desktop row */}

      </header>

      {/* Map wrapper — also hosts the floating filters/search panel below, as an
          absolutely-positioned overlay anchored to ITS top edge instead of the
          viewport. Previously the panel was position:fixed relative to the page,
          so in non-fullscreen it stayed glued to the same screen spot no matter how
          far you scrolled — obscuring the map and the races list behind it the whole
          time instead of just while the map was actually in view. Nesting it here,
          positioned absolute within this wrapper, makes it scroll in lockstep with
          the map (which is itself a normal in-flow page element in non-fullscreen):
          once the map scrolls out of view, the panel goes with it instead of
          lingering. In fullscreen this wrapper is the one pinned to the viewport (as
          before), so the panel still reads as a fixed overlay there — unaffected. */}
      <div
        ref={mapWrapperRef}
        className={isMapFullscreen ? "fixed inset-x-0 bottom-0 z-40 bg-background" : "relative"}
        style={isMapFullscreen ? { top: 0 } : undefined}
      >
      {filterPanelOpen && (
        <div
          ref={filterPanelRef}
          className={`absolute inset-x-0 top-0 z-[500] ${showFilterBar || showSearch ? "bg-background/70 backdrop-blur-md" : "bg-background/25 backdrop-blur-md"}`}
        >
        {/* Row 4: Sub-filter buttons (visible when Filters is open) */}
        {showFilterBar && (
          <div className="flex items-center gap-2 px-4 pb-3 pt-3 flex-wrap">

            {/* Tabs: Races | Dates | Locations | Explore */}
            <div className="flex gap-1">
              {/* Races tab */}
              <button
                onClick={() => setActiveSubPanel(p => p === 'race' ? null : 'race')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all border rounded-lg hover:bg-primary/10 hover:text-primary ${
                  activeSubPanel === 'race'
                    ? "bg-primary/15 text-primary border-primary"
                    : raceFiltersActive
                    ? "text-primary border-transparent"
                    : "text-primary/70 border-transparent"
                }`}
              >
                Races
                {raceFiltersActive && (
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {sportFilters.size + subFilters.size + teamFilters.size}
                  </span>
                )}
              </button>

              {/* Dates tab */}
              <button
                onClick={() => setActiveSubPanel(p => p === 'dates' ? null : 'dates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all border rounded-lg hover:bg-violet-500/10 hover:text-violet-400 ${
                  activeSubPanel === 'dates'
                    ? "bg-violet-500/15 text-violet-400 border-violet-400"
                    : monthFilters.length > 0 || yearFilters.length > 0
                    ? "text-violet-400 border-transparent"
                    : "text-violet-400/70 border-transparent"
                }`}
              >
                Dates
                {(monthFilters.length + yearFilters.length) > 0 && (
                  <span className="bg-violet-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {monthFilters.length + yearFilters.length}
                  </span>
                )}
              </button>

              {/* Locations tab */}
              <button
                onClick={() => setActiveSubPanel(p => p === 'locations' ? null : 'locations')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all border rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 ${
                  activeSubPanel === 'locations'
                    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500"
                    : countryFilters.length > 0
                    ? "text-emerald-500 border-transparent"
                    : "text-emerald-500/70 border-transparent"
                }`}
              >
                Locations
                {countryFilters.length > 0 && (
                  <span className="bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {countryFilters.length}
                  </span>
                )}
              </button>

              {/* Explore tab — green to match the Explore pins' own color on the map,
                  not orange (reserved for votes elsewhere: Most Voted, vote badges) */}
              <button
                onClick={() => setActiveSubPanel(p => p === 'explore' ? null : 'explore')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all border rounded-lg hover:bg-green-500/10 hover:text-green-500 ${
                  activeSubPanel === 'explore'
                    ? "bg-green-500/15 text-green-500 border-green-500"
                    : exploreCategoryFilters.length > 0
                    ? "text-green-500 border-transparent"
                    : "text-green-500/70 border-transparent"
                }`}
              >
                Explore
                {exploreCategoryFilters.length > 0 && (
                  <span className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {exploreCategoryFilters.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Search bar */}
        {showSearch && (
          <div className="px-4 pb-3 pt-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search races, locations, countries..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm text-foreground outline-none focus:border-primary"
              autoFocus
              style={{ fontSize: "16px" }}
            />
          </div>
        )}

        {/* Race sub-panel */}
        {showFilterBar && activeSubPanel === 'race' && (
          <div className="relative">
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-4 overflow-y-auto filter-panel" style={{ maxHeight: "60vh", touchAction: "pan-y", overscrollBehavior: "contain", paddingBottom: "4.5rem" }}>

            {/* ── Sports & Distances ── */}
            <div>
              <div className="filter-label mb-2">Sports &amp; Distances</div>
              {/* Sports pills — flex-wrap, overflow-x-auto when distances expand */}
              <div className="flex flex-wrap items-center gap-y-2 overflow-x-auto pb-1" style={{ gap: "0", rowGap: "8px", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
                {[...SPORT_SECTIONS].sort((a, b) => b.subFilters.length - a.subFilters.length).map((section, sIdx) => {
                  const isExpanded = expandedSections.has(section.key);
                  const isSelected = sportFilters.has(section.key);
                  const activeSubs = section.subFilters.filter(sf => subFilters.has(sf.value));
                  const activeSubCount = activeSubs.length;
                  const hasSubActive = activeSubCount > 0;
                  // Auto-select parent when ALL sub-filters chosen
                  const allSubsSelected = activeSubCount === section.subFilters.length;

                  const pillClass = (isSelected || allSubsSelected)
                    ? "bg-primary/15 border-primary text-primary"
                    : hasSubActive
                    ? "bg-transparent border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground";

                  // Arrow area: amber bg (no amber border) when not selected, full amber when partial, blue when fully selected
                  const arrowClass = (isSelected || allSubsSelected)
                    ? "bg-primary/15 border-primary text-primary"
                    : hasSubActive
                    ? "bg-amber-400/15 border-amber-500 text-amber-500"
                    : "bg-amber-400/10 border-border text-amber-500/70 hover:border-border hover:bg-amber-400/15";

                  return (
                    <div key={section.key} className="flex items-center shrink-0" style={{ marginRight: "6px", marginBottom: "0" }}>
                      {/* Parent pill */}
                      <div className="flex items-stretch">
                        {/* Label — tap = select all (clears sub-filters) */}
                        <button
                          onClick={() => {
                            if (isSelected || allSubsSelected) {
                              // deselect: clear parent and all subs
                              if (isSelected) toggleSportPill(section.key);
                              section.subFilters.forEach(sf => { if (subFilters.has(sf.value)) toggleSubFilter(sf.value); });
                            } else {
                              // select all: clear subs, select parent
                              section.subFilters.forEach(sf => { if (subFilters.has(sf.value)) toggleSubFilter(sf.value); });
                              if (!isSelected) toggleSportPill(section.key);
                            }
                          }}
                          className={`flex items-center gap-1 pl-3.5 pr-2 py-1 rounded-l-full border border-r-0 text-xs font-medium transition-all whitespace-nowrap ${pillClass}`}
                        >
                          {section.label}
                        </button>
                        {/* Divider */}
                        <div className={`w-px self-stretch ${isSelected || allSubsSelected ? "bg-primary/40" : hasSubActive ? "bg-amber-400/50" : "bg-border"}`} />
                        {/* Right area — count circle when partial, ALL or DIST as plain text, no arrows ever */}
                        <button
                          onClick={() => toggleSection(section.key)}
                          className={`flex items-center justify-center pl-1.5 pr-2.5 py-1 rounded-r-full border border-l-0 text-xs font-bold transition-all ${arrowClass}`}
                        >
                          {(isSelected || allSubsSelected)
                            ? <span className="text-[10px] font-bold leading-none tracking-wide">ALL</span>
                            : hasSubActive
                            ? <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] font-bold leading-none">{activeSubCount}</span>
                            : <span className="text-[10px] font-bold leading-none tracking-wide">SPEC</span>
                          }
                        </button>
                      </div>

                      {/* Inline chain: connector + sub-pills, same row */}
                      {isExpanded && (
                        <div className="flex items-center">
                          {/* Connector line from parent to first sub-pill */}
                          <div className="h-px w-3 flex-shrink-0 bg-amber-400/50" />
                          {section.subFilters.map((sf, idx) => {
                            const isSubActive = subFilters.has(sf.value);
                            const isLast = idx === section.subFilters.length - 1;
                            return (
                              <div key={sf.value} className="flex items-center">
                                <button
                                  onClick={() => {
                                    if (isSelected || allSubsSelected) {
                                      // Parent was fully selected: deselect parent, activate ONLY this distance
                                      setSportFilters(prev => { const n = new Set(prev); n.delete(section.key); return n; });
                                      setSubFilters(prev => {
                                        const n = new Set(prev);
                                        section.subFilters.forEach(s => n.delete(s.value));
                                        n.add(sf.value); // activate only this one
                                        return n;
                                      });
                                    } else {
                                      // Normal toggle
                                      const willActivate = !isSubActive;
                                      toggleSubFilter(sf.value);
                                      // If this makes ALL subs active → auto-promote to parent
                                      if (willActivate) {
                                        const newCount = activeSubs.filter(s => s.value !== sf.value).length + 1;
                                        if (newCount === section.subFilters.length) {
                                          setTimeout(() => {
                                            setSportFilters(prev => { const n = new Set(prev); n.add(section.key); return n; });
                                            setSubFilters(prev => { const n = new Set(prev); section.subFilters.forEach(s => n.delete(s.value)); return n; });
                                          }, 0);
                                        }
                                      }
                                    }
                                  }}
                                  className={`flex items-center justify-center text-xs px-3 py-1.5 rounded-full border font-medium transition-all leading-none whitespace-nowrap ${
                                    (isSubActive || isSelected || allSubsSelected)
                                      ? "bg-amber-400/15 border-amber-500 text-amber-500 dark:text-amber-400"
                                      : "border-border text-muted-foreground hover:border-amber-400/50 hover:text-amber-500 dark:hover:text-amber-400"
                                  }`}
                                >
                                  {sf.label}
                                </button>
                                {/* Connector between sub-pills */}
                                {!isLast && <div className="h-px w-2 flex-shrink-0 bg-amber-400/40" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Simple sport pills — same row, no arrow */}
                {SIMPLE_SPORT_PILLS.map(pill => (
                  <button
                    key={pill.value}
                    onClick={() => toggleSportPill(pill.value)}
                    style={{ marginRight: "6px" }}
                    className={`flex items-center justify-center text-xs px-3 py-1.5 rounded-full border font-medium transition-all leading-none whitespace-nowrap ${
                      sportFilters.has(pill.value)
                        ? "bg-primary/15 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Format ── */}
            <div>
              <div className="filter-label mb-2">Format</div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {TEAM_PILLS.map(pill => (
                  <button
                    key={pill.value}
                    onClick={() => toggleTeamFilter(pill.value)}
                    className={`flex items-center justify-center text-xs px-3 py-1.5 rounded-full border font-medium transition-all leading-none ${
                      teamFilters.has(pill.value)
                        ? "bg-primary/15 border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 right-4 sm:right-auto sm:left-4 z-10 flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center justify-center px-3 py-1.5 rounded-full border border-border text-muted-foreground text-xs font-semibold hover:opacity-80 transition-all shadow-md leading-none bg-card/80 backdrop-blur-sm"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => { setShowFilterBar(false); setActiveSubPanel(null); }}
              className="flex items-center justify-center px-4 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-md leading-none"
            >
              Done ✓
            </button>
          </div>
          </div>
        )}

        {/* Locations sub-panel */}
        {showFilterBar && activeSubPanel === 'locations' && (
          <div className="relative">
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-4 overflow-y-auto filter-panel" style={{ maxHeight: "55vh", touchAction: "pan-y", overscrollBehavior: "contain", paddingBottom: "4.5rem" }}>
            {/* Region */}
            <div>
              <div className="filter-label mb-2">Region</div>
              <div className="flex flex-wrap gap-1.5">
                {REGIONS.map(region => {
                  const state = getRegionState(region);
                  return (
                    <button
                      key={region.value}
                      onClick={() => toggleRegion(region.value)}
                      className={`flex items-center justify-center text-xs px-3 py-1.5 rounded-full border font-medium transition-all leading-none ${
                        state === 'all'
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-500"
                          : state === 'partial'
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500/70"
                          : "border-border text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-500"
                      }`}
                    >
                      {region.label}
                      {state === 'partial' && (
                        <span className="ml-1 text-[10px] opacity-70">
                          ({region.countries.filter(c => countryFilters.includes(c)).length}/{region.countries.length})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Country */}
            <div>
              <div className="filter-label mb-2">Country</div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {COUNTRIES.map(c => (
                  <button key={c.value} onClick={() => toggleCountry(c.value)} className={`flex items-center justify-center text-xs px-3 py-1.5 rounded-full border font-medium transition-all leading-none ${
                    countryFilters.includes(c.value)
                      ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-500"
                      : "border-border text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-500"
                  }`}>{c.label}</button>
                ))}
              </div>
            </div>
            {/* City — only shown when at least one country is selected; Done button always at end */}
            {countryFilters.length > 0 && (() => {
              const sourceRaces = races.filter(r => countryFilters.includes(r.country));
              const cityCount = new Map<string, number>();
              sourceRaces.forEach(r => {
                const city = extractCity(r.location);
                cityCount.set(city, (cityCount.get(city) ?? 0) + 1);
              });
              const cities = [...cityCount.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([city]) => city);
              return (
                <div>
                  <div className="filter-label mb-2">City</div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {cities.map(city => (
                      <button key={city} onClick={() => setCityFilters(p => p.includes(city) ? p.filter(c => c !== city) : [...p, city])}
                        className={`flex items-center justify-center text-xs px-3 py-1.5 rounded-full border font-medium transition-all leading-none ${
                          cityFilters.includes(city)
                            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-500"
                            : "border-border text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-500"
                        }`}
                      >{city} <span className="ml-1 opacity-50 text-[10px]">{cityCount.get(city)}</span></button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="absolute bottom-5 right-4 sm:right-auto sm:left-4 z-10 flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center justify-center px-3 py-1.5 rounded-full border border-border text-muted-foreground text-xs font-semibold hover:opacity-80 transition-all shadow-md leading-none bg-card/80 backdrop-blur-sm"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => { setShowFilterBar(false); setActiveSubPanel(null); }}
              className="flex items-center justify-center px-4 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-md leading-none"
            >
              Done ✓
            </button>
          </div>
          </div>
        )}

        {/* Explore sub-panel */}
        {showFilterBar && activeSubPanel === 'explore' && (
          <div className="relative">
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-4 overflow-y-auto filter-panel" style={{ maxHeight: "55vh", touchAction: "pan-y", overscrollBehavior: "contain", paddingBottom: "4.5rem" }}>
            <div>
              <div className="filter-label mb-2">Points of Interest</div>
              <div className="flex flex-wrap gap-1.5">
                {EXPLORE_CATEGORIES.map(c => (
                  <button key={c} onClick={() => toggleExploreCategory(c)} className={`flex items-center justify-center text-xs px-3 py-1.5 rounded-full border font-medium transition-all leading-none ${
                    exploreCategoryFilters.includes(c)
                      ? "bg-green-500/15 border-green-500/50 text-green-500"
                      : "border-border text-muted-foreground hover:border-green-500/30 hover:text-green-500"
                  }`}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 right-4 sm:right-auto sm:left-4 z-10 flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center justify-center px-3 py-1.5 rounded-full border border-border text-muted-foreground text-xs font-semibold hover:opacity-80 transition-all shadow-md leading-none bg-card/80 backdrop-blur-sm"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => { setShowFilterBar(false); setActiveSubPanel(null); }}
              className="flex items-center justify-center px-4 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-md leading-none"
            >
              Done ✓
            </button>
          </div>
          </div>
        )}

        {/* Dates sub-panel */}
        {showFilterBar && activeSubPanel === 'dates' && (
          <div className="relative">
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-4 overflow-y-auto filter-panel" style={{ maxHeight: "65vh", touchAction: "pan-y", overscrollBehavior: "contain", paddingBottom: "4.5rem" }}>
            {/* Quick presets */}
            <div>
              <div className="filter-label">Quick Select</div>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { label: "Next 3 months", fn: () => { const f = new Date(); const t = new Date(); t.setMonth(t.getMonth()+3); setDateRange({from:f,to:t}); setMonthFilters([]); setYearFilters([]); } },
                  { label: "Rest of 2026", fn: () => { setDateRange({ from: new Date(), to: new Date("2026-12-31") }); setMonthFilters([]); setYearFilters([]); } },
                  { label: "All of 2027", fn: () => { setDateRange({ from: new Date("2027-01-01"), to: new Date("2027-12-31") }); setMonthFilters([]); setYearFilters([]); } },
                ] as {label:string,fn:()=>void}[]).map(({label,fn}) => (
                  <button key={label} onClick={fn} className="flex items-center justify-center text-xs px-3 py-1.5 rounded-full border font-medium transition-all leading-none border-border text-muted-foreground hover:border-violet-400/50 hover:text-violet-400">{label}</button>
                ))}
              </div>
              {(dateRange.from || dateRange.to) && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-500 font-semibold">
                  <Calendar size={11} />
                  <span>{dateRange.from ? dateRange.from.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "Any"}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{dateRange.to ? dateRange.to.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "Any"}</span>
                  <button onClick={() => setDateRange({from:undefined,to:undefined})} className="ml-1 hover:text-red-400"><X size={10}/></button>
                </div>
              )}
            </div>
            {/* Calendar picker */}
            <div>
              <div className="filter-label flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setShowDatePicker(v => !v)}>
                <Calendar size={11} /> Custom Range <span className="text-muted-foreground/50 text-[10px]">{showDatePicker ? "▲" : "▼"}</span>
              </div>
              {showDatePicker && (
                <div className="mt-2 rounded-xl border border-border bg-card p-2 overflow-x-auto rdp-compact">
                  <DayPicker
                    mode="range"
                    selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                    fromYear={2026}
                    toYear={2028}
                    showOutsideDays
                  />
                </div>
              )}
            </div>
            <div>
              <div className="filter-label">Month</div>
              <div className="flex flex-wrap gap-1.5">
                {MONTHS.map(m => (
                  <button key={m} onClick={() => toggleMonth(m)} className={`flex items-center justify-center text-xs px-3 py-1.5 rounded-full border font-medium transition-all leading-none ${
                    monthFilters.includes(m)
                      ? "bg-violet-400/15 border-violet-400/50 text-violet-400"
                      : "border-border text-muted-foreground hover:border-violet-400/30 hover:text-violet-400"
                  }`}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="filter-label">Year</div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {YEARS.map(y => (
                  <button key={y} onClick={() => toggleYear(y)} className={`flex items-center justify-center text-xs px-3 py-1.5 rounded-full border font-medium transition-all leading-none ${
                    yearFilters.includes(y)
                      ? "bg-violet-400/15 border-violet-400/50 text-violet-400"
                      : "border-border text-muted-foreground hover:border-violet-400/30 hover:text-violet-400"
                  }`}>{y}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 right-4 sm:right-auto sm:left-4 z-10 flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center justify-center px-3 py-1.5 rounded-full border border-border text-muted-foreground text-xs font-semibold hover:opacity-80 transition-all shadow-md leading-none bg-card/80 backdrop-blur-sm"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => { setShowFilterBar(false); setActiveSubPanel(null); }}
              className="flex items-center justify-center px-4 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-md leading-none"
            >
              Done ✓
            </button>
          </div>
          </div>
        )}

        {/* Active filter pills row — Done button always at far right when filters open */}
        {activeFilterCount > 0 && (
          <div className="flex gap-1.5 px-4 py-2.5 text-xs items-center border-t border-border flex-nowrap overflow-x-auto bg-transparent" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            {/* Races — blue */}
            {[...sportFilters].map(key => (
              <span key={key} className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-primary/10 border border-primary/30 text-primary font-medium">
                {getSportLabel(key)}
                <button onClick={() => toggleSportPill(key)} className="hover:opacity-70 leading-none"><X size={10} /></button>
              </span>
            ))}
            {[...subFilters].map(val => (
              <span key={val} className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-red-500/15 border border-red-500/50 text-red-600 dark:text-red-400 font-medium">
                {getSubFilterLabel(val)}
                <button onClick={() => toggleSubFilter(val)} className="hover:opacity-70 leading-none"><X size={10} /></button>
              </span>
            ))}
            {[...teamFilters].map(val => {
              const pill = TEAM_PILLS.find(p => p.value === val);
              return pill ? (
                <span key={val} className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-primary/10 border border-primary/30 text-primary font-medium">
                  {pill.label}<button onClick={() => toggleTeamFilter(val)} className="hover:opacity-70 leading-none"><X size={10} /></button>
                </span>
              ) : null;
            })}
            {/* Locations — green: show region pill if fully selected, else individual countries */}
            {(() => {
              const fullySelectedRegions = REGIONS.filter(r => r.countries.every(c => countryFilters.includes(c)));
              const coveredByRegion = new Set(fullySelectedRegions.flatMap(r => r.countries));
              const remainingCountries = countryFilters.filter(c => !coveredByRegion.has(c));
              return (
                <>
                  {fullySelectedRegions.map(r => (
                    <span key={r.value} className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-medium">
                      {r.label}
                      <button onClick={() => toggleRegion(r.value)} className="hover:opacity-70 leading-none"><X size={10} /></button>
                    </span>
                  ))}
                  {remainingCountries.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-medium">
                      {COUNTRIES.find(x => x.value === c)?.label ?? c}
                      <button onClick={() => toggleCountry(c)} className="hover:opacity-70 leading-none"><X size={10} /></button>
                    </span>
                  ))}
                </>
              );
            })()}
            {/* Cities — green (same as locations) */}
            {cityFilters.map(city => (
              <span key={city} className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-medium">
                📍 {city}
                <button onClick={() => setCityFilters(p => p.filter(c => c !== city))} className="hover:opacity-70 leading-none"><X size={10} /></button>
              </span>
            ))}
            {exploreCategoryFilters.map(c => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-green-500/10 border border-green-500/30 text-green-500 font-medium">
                {c}
                <button onClick={() => toggleExploreCategory(c)} className="hover:opacity-70 leading-none"><X size={10} /></button>
              </span>
            ))}
            {/* Dates — violet */}
            {monthFilters.map(m => (
              <span key={m} className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-violet-500/10 border border-violet-400/30 text-violet-400 font-medium">
                {m}<button onClick={() => toggleMonth(m)} className="hover:opacity-70 leading-none"><X size={10} /></button>
              </span>
            ))}
            {yearFilters.map(y => (
              <span key={y} className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-violet-500/10 border border-violet-400/30 text-violet-400 font-medium">
                {y}<button onClick={() => toggleYear(y)} className="hover:opacity-70 leading-none"><X size={10} /></button>
              </span>
            ))}

            {/* Date range pill */}
            {(dateRange.from || dateRange.to) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-violet-500/10 border border-violet-400/30 text-violet-400 font-medium">
                <Calendar size={10} />
                {dateRange.from ? dateRange.from.toLocaleDateString("en-GB",{day:"numeric",month:"short"}) : "?"} → {dateRange.to ? dateRange.to.toLocaleDateString("en-GB",{day:"numeric",month:"short"}) : "?"}
                <button onClick={() => setDateRange({from:undefined,to:undefined})} className="hover:opacity-70 leading-none"><X size={10} /></button>
              </span>
            )}
            {/* Search */}
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full shrink-0 whitespace-nowrap bg-primary/10 border border-primary/30 text-primary font-medium">
                "{search}"<button onClick={() => setSearch("")} className="hover:opacity-70 leading-none"><X size={10} /></button>
              </span>
            )}

          </div>
        )}
        </div>
      )}

      <MapView
        races={filtered}
        allRaces={races}
        sites={filteredExploreSites}
        favSet={favSet}
        voterName={voterName}
        votesByRace={votesByRace}
        exploreFavSet={exploreFavSet}
        exploreVotesBySite={exploreVotesBySite}
        showFavsOnly={showFavs}
        countryFilters={countryFilters}
        onToggleFav={(raceId, isFav) => isFav ? removeFav.mutate(raceId) : addFav.mutate(raceId)}
        onToggleExploreFav={(id: number) => exploreFavSet.has(id) ? removeExploreFav.mutate(id) : addExploreFav.mutate(id)}
        isDark={isDark}
        hidePast={hidePast}
        onToggleHidePast={() => setHidePast(v => !v)}
        showUnconfirmed={showUnconfirmed}
        onToggleUnconfirmed={() => setShowUnconfirmed(v => !v)}
        recenterRef={mapRecenterRef}
        isFullscreen={isMapFullscreen}
        onToggleFullscreen={() => setIsMapFullscreen(v => !v)}
        showFilterBar={showFilterBar}
        onToggleFilterBar={handleToggleFilterBar}
        activeFilterCount={activeFilterCount}
        onClearAllFilters={clearAll}
        onToggleFavs={handleToggleFavs}
        sortMode={sortMode}
        onToggleMostVoted={handleToggleMostVoted}
        onToggleTheme={() => setIsDark(d => !d)}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch(v => !v)}
      />
      </div>

      {/* ── Back to Map floating button ── */}
      {showBackToMap && (
        <button
          onClick={() => {
            const el = mapWrapperRef.current;
            if (el) {
              const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h") || "0");
              const top = el.getBoundingClientRect().top + window.scrollY - headerH;
              window.scrollTo({ top, behavior: "smooth" });
            }
            setTimeout(() => { mapRecenterRef.current?.(); }, 600);
          }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold border shadow-lg transition-all hover:brightness-110 bg-background border-orange-400 text-orange-500 dark:text-orange-400"
          style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.35))" }}
        >
          <MapPin size={10} />
          Back to Map
        </button>
      )}

      {/* Hidden while the map is fullscreen — otherwise this content, now that the map
          above it is position:fixed and out of flow, would jump up and overlap it. */}
      <div style={isMapFullscreen ? { display: "none" } : undefined}>
      {/* ── Races section ── */}
      <div
        ref={racesHeaderRef}
        className="bg-card/95 backdrop-blur-sm flex flex-row items-center px-4 py-3 sticky z-[40] cursor-pointer select-none gap-0"
        style={{ top: "calc(var(--header-h, 0px) - 1px)", boxShadow: "0 1px 0 0 hsl(var(--border))" }}
        onClick={() => setShowRaceList(v => !v)}
        role="button"
        aria-label={showRaceList ? "Collapse race list" : "Expand race list"}
      >
        <span style={{ lineHeight: 1 }} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Races</span>
        <span style={{ lineHeight: 1 }} className="ml-2 text-xs text-muted-foreground/50">{filtered.length} {filtered.length === 1 ? "race" : "races"}</span>
        {showFavs && (
          <button
            onClick={e => { e.stopPropagation(); setShowFavs(false); }}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-opacity hover:opacity-70"
            style={{ color: "#ca8a04", borderColor: "#ca8a04", lineHeight: 1 }}
          >
            <Star size={9} fill="#ca8a04" /> Showing My Votes <X size={9} />
          </button>
        )}
        {sortMode === "votes" && !showFavs && (
          <button
            onClick={e => { e.stopPropagation(); setSortMode("date"); }}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border border-orange-500 text-orange-500 transition-opacity hover:opacity-70"
            style={{ lineHeight: 1 }}
          >
            <TrendingUp size={9} /> Showing Most Voted <X size={9} />
          </button>
        )}
        {!showFavs && activeFilterCount > 0 && (
          <span style={{ lineHeight: 1 }} className="ml-2 text-[10px] text-primary font-semibold inline-flex items-center gap-1">
            <Filter size={9} /> Active Filters
          </span>
        )}
        <span className="ml-auto p-1 text-muted-foreground">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showRaceList ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </span>
      </div>

      {showRaceList && <>
        <div className="table-wrap-outer">
        <div className="overflow-x-auto table-wrap" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-primary border-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm">Loading races...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <div className="text-center space-y-2">
                <Globe2 size={32} className="mx-auto opacity-30" />
                <p className="text-sm">{sortMode === "votes" ? "No voted races yet — star a race to vote" : "No races match your filters"}</p>

              </div>
            </div>
          ) : (
            <table className="min-w-full" style={{ borderCollapse: "collapse", tableLayout: "auto", width: "max-content", minWidth: "100%" }}>
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th style={{ width: COL_WIDTHS[0] }} className="py-2 px-3 text-center text-[10px] font-bold uppercase tracking-tight text-muted-foreground">★</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">Voters</th>
                  <th style={{ minWidth: COL_WIDTHS[1] }} className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Name</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">Sport</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">Location</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">Date</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">Weather</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">Distance</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-tight text-muted-foreground whitespace-nowrap">Format</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Month group label using parseFuzzyDate for accurate month/year
                  const getMonthGroup = (r: any): string => {
                    let primary = r.date as string;
                    try { const ds = JSON.parse((r as any).dates ?? "[]"); if (ds.length > 0) primary = ds[0].date; } catch {}
                    const parsed = parseFuzzyDate(primary.trim());
                    if (parsed) {
                      const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parsed.getMonth()];
                      return `${mon} ${parsed.getFullYear()}`;
                    }
                    // Fallback: first word + last word
                    const parts = primary.trim().split(" ");
                    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : primary;
                  };
                  let lastMonthGroup = "";
                  return sortedFiltered.map((race) => {
                    const monthGroup = getMonthGroup(race);
                    const showGroupHeader = monthGroup !== lastMonthGroup;
                    lastMonthGroup = monthGroup;
                  const isFav = favSet.has(race.id);
                  const isScratched = race.status === "scratched";
                  const isWatchlist = race.status === "watchlist";
                  const weather = getRaceWeather(race.location, race.date);
                  const showWaterTemp = weather?.waterTemp != null && (
                    ["triathlon", "swimming", "swimrun"].includes(race.type) ||
                    (race.type === "ocr" && /swim|river|lake|aqua|water/i.test(race.name))
                  );
                  const flag = COUNTRY_WEATHER[race.country]?.flag ?? "";
                  const city = race.location.split(",")[0].trim();
                  const distPills = (race.distanceLabel ?? "").split("·").map((p: string) => p.trim()).filter(Boolean);
                  const formatDisplay = formatTeamDisplay(race.team ?? "");
                  const rowBg = isScratched ? "row-scratch" : isFav ? "row-fav" : isWatchlist ? "row-watchlist" : "hover:bg-muted/30";
                  // Detect if earliest date is in the past
                  const isPast = (() => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    try {
                      const ds: {date:string,status:string}[] = JSON.parse((race as any).dates ?? "[]");
                      const allD = ds.length > 0 ? ds.map(d => d.date) : [race.date];
                      const dates = allD.map(d => parseFuzzyDate(d)).filter((d): d is Date => d !== null);
                      if (dates.length === 0) return false;
                      // Only gray out if ALL dates are in the past
                      const latest = dates.sort((a,b) => b.getTime()-a.getTime())[0];
                      return latest < today;
                    } catch { return false; }
                  })();
                  return (
                    <React.Fragment key={race.id}>
                      {showGroupHeader && (
                        <tr className="bg-muted/50 border-y border-border/60">
                          <td colSpan={9} className="px-4 py-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 select-none">{monthGroup}</span>
                          </td>
                        </tr>
                      )}
                      <>
                      <tr className={`border-b border-border transition-colors ${rowBg} ${isPast ? "opacity-40 grayscale-[60%]" : ""}`}>
                        {/* ★ Star */}
                        <td className="text-center py-4 px-3" style={{ width: COL_WIDTHS[0], verticalAlign: 'middle' }}>
                          {!isScratched && (
                            <button
                              onClick={() => isFav ? removeFav.mutate(race.id) : addFav.mutate(race.id)}
                              disabled={addFav.isPending || removeFav.isPending}
                              className={`star-btn ${isFav ? "starred" : "hover:text-yellow-400/70"} disabled:opacity-50`}
                              title={isFav ? "Unvote" : "Vote"}
                            >
                              <Star size={15} className={isFav ? "fill-yellow-400 text-yellow-400" : ""} />
                            </button>
                          )}
                        </td>
                        {/* Voters chips */}
                        <td className="py-2 px-2 text-center" style={{ minWidth: 60, maxWidth: 80, verticalAlign: 'middle' }}>
                          <div className="flex items-center justify-center w-full">
                            {(() => {
                              const voters = votesByRace.get(race.id) ?? [];
                              if (voters.length === 0) return <span className="text-muted-foreground/30 text-xs">—</span>;
                              return <VoterChips voters={voters} compact />;
                            })()}
                          </div>
                        </td>
                        {/* Name + note (name is a link if URL exists) */}
                        <td className="py-4 px-3 align-middle" style={{ minWidth: COL_WIDTHS[1], maxWidth: 240 }}>
                          <div className="truncate font-bold text-sm leading-snug" title={race.name}>
                            {isWatchlist && <AlertTriangle size={11} className="inline text-red-500 dark:text-red-400 mr-1 mb-0.5" aria-label="Unconfirmed date" />}
                            {race.url ? (
                              <a href={race.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors ext-link">
                                {race.name}
                              </a>
                            ) : (
                              <span className="text-foreground">{race.name}</span>
                            )}
                          </div>
                          {race.note && (
                            <div className="truncate text-[11px] text-amber-700 dark:text-yellow-400 mt-0.5 leading-snug font-medium" title={race.note}>
                              {race.note}
                            </div>
                          )}
                        </td>
                        {/* Sport column: pill + condition inline */}
                        <td className="py-4 px-3 align-middle">
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            <SportPill cls={race.badgeClass} />
                            {(() => {
                              const cond = getSportCondition(race.type, (race as any).venue, race.name);
                              return cond
                                ? <span className="text-xs text-muted-foreground whitespace-nowrap">{cond}</span>
                                : null;
                            })()}
                          </div>
                        </td>
                        {/* Location (flag + country + city) */}
                        <td className="py-4 px-3 align-middle" style={{ minWidth: 160, maxWidth: 220 }}>
                          <div className="truncate text-sm text-foreground whitespace-nowrap" title={`${race.country} · ${city}`}>{flag} {race.country} <span className="text-muted-foreground/50">·</span> <span className="text-muted-foreground">{city}</span></div>
                        </td>
                        {/* Date — multi-year support */}
                        <td className="py-4 px-3 align-middle">
                          {(() => {
                            let raceDates: {date: string, status: string}[] = [];
                            try { raceDates = JSON.parse((race as any).dates ?? "[]"); } catch {}
                            if (raceDates.length === 0) raceDates = [{date: race.date, status: race.status}];
                            return raceDates.map((d, i) => {
                              const isUnconfirmed = d.status === "watchlist";
                              return (
                                <div key={i} className={`flex items-center gap-1.5 ${i > 0 ? "mt-1" : ""}`}>
                                  <div className={`text-sm whitespace-nowrap font-medium ${isUnconfirmed ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    {formatRaceDate(d.date)}
                                  </div>
                                  {isUnconfirmed && (
                                    <span
                                      className="text-[9px] font-bold uppercase tracking-wide text-red-500 dark:text-red-400 flex-shrink-0"
                                      title="Not yet officially confirmed — based on last year's pattern or organizer hasn't locked a date"
                                    >
                                      Unconfirmed
                                    </span>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </td>
                        {/* Weather */}
                        <td className="py-4 px-3 align-middle" style={{ whiteSpace: "nowrap" }}>
                          {weather ? (
                            <div>
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                <span className="text-muted-foreground/60">Air: </span>{weather.temp}°C · {weather.condition}
                              </div>
                              {showWaterTemp && weather.waterTemp != null && (
                                <div className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                                  <span className="text-muted-foreground/60">Water: </span>{weather.waterTemp}°C
                                </div>
                              )}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        {/* Distance */}
                        <td className="py-2 px-3 align-middle" style={{ minWidth: 80, width: 'auto' }}>
                          {distPills.length > 0 ? (
                            <div className="flex flex-wrap gap-1" style={{ maxHeight: '48px', maxWidth: '150px', overflow: 'hidden', alignContent: 'flex-start' }}>
                              {distPills.map((p: string, i: number) => (
                                <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold leading-none whitespace-nowrap ${getDistPillClass(p)}`}>{p}</span>
                              ))}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        {/* Format (team pills) */}
                        <td className="py-4 px-3 align-middle">
                          {formatDisplay ? (
                            <div className="flex flex-nowrap items-center gap-1">
                              {formatDisplay.split(" · ").map((f: string, i: number) => (
                                <span key={i} className="text-xs font-medium leading-none whitespace-nowrap px-2 py-1 rounded-full border border-border/70 text-muted-foreground bg-muted/40">
                                  {f}
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>

                      </tr>
                      {/* Note moved into Name cell — sub-row removed */}
                    </>
                    </React.Fragment>
                  );
                  });
                })()}
              </tbody>
            </table>
          )}
        </div>
        </div>{/* end table-wrap-outer */}
      </>}

      {/* ── Explore ── */}
      <ExploreSection
        sites={exploreSites}
        filteredSites={filteredExploreSites}
        showFavsOnly={showFavs}
        hasActiveFilters={activeFilterCount > 0}
        stickyTop="var(--header-h, 0px)"
        exploreFavSet={exploreFavSet}
        onToggleExploreFav={(id: number) => exploreFavSet.has(id) ? removeExploreFav.mutate(id) : addExploreFav.mutate(id)}
        exploreFavPending={addExploreFav.isPending || removeExploreFav.isPending}
        exploreVotesBySite={exploreVotesBySite}
      />

      {/* Footer */}
      <div className="footer-credit text-center text-xs py-6">
        💘 Created by Lukas
      </div>
      </div>
    </div>
  );
}
