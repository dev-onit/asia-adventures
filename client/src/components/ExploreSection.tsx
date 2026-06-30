import { useState } from "react";
import type { ExploreSite } from "../../../shared/schema";
import { COUNTRY_WEATHER } from "../lib/raceGeo";
import VoterChips from "./VoterChips";

interface Props {
  sites: ExploreSite[];
  filteredSites: ExploreSite[];
  showFavsOnly: boolean;
  favCountries: Set<string>;
  hasActiveFilters: boolean;
  stickyTop?: string;
  exploreFavSet: Set<number>;
  onToggleExploreFav: (id: number) => void;
  exploreFavPending: boolean;
  exploreVotesBySite: Map<number, string[]>;
}

// Must match MapView.tsx's CATEGORY_COLORS — these used to diverge (this file still had
// the pre-collision palette where Mountains/Islands/Cities shared colors with race types
// on the map), so the same category showed two different colors depending on which view
// you were looking at.
const CATEGORY_COLORS: Record<string, string> = {
  Mountains: "#16a34a",
  Islands:   "#0d9488",
  Cities:    "#84cc16",
  Temples:   "#f59e0b",
  Nature:    "#22c55e",
  Beaches:   "#ec4899",
};

export default function ExploreSection({ sites, filteredSites, showFavsOnly, hasActiveFilters, stickyTop, exploreFavSet, onToggleExploreFav, exploreFavPending, exploreVotesBySite }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      {/* Header */}
      <div
        className="border-t border-border px-4 py-3 bg-card/80 backdrop-blur-sm flex items-center sticky z-[41] cursor-pointer select-none"
        style={{ top: stickyTop ?? "0px" }}
        onClick={() => setIsExpanded(v => !v)}
        role="button"
        aria-label={isExpanded ? "Collapse" : "Expand"}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explore</span>
        <span className="ml-2 text-xs text-muted-foreground/50">{filteredSites.length} {filteredSites.length === 1 ? "place" : "places"} around race area</span>
        <span className="ml-auto p-1 text-muted-foreground">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </span>
      </div>

      {/* Card grid */}
      {isExpanded && (
        <div className="p-3 sm:p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
          {filteredSites.map(site => {
            const flag = COUNTRY_WEATHER[site.country]?.flag ?? "";
            const color = CATEGORY_COLORS[site.category] ?? "#94a3b8";
            // Real description data is already a terse 81-138 char blurb (by design) —
            // this cap is just a safety net well above that range so the UI never
            // truncates an already-short description on top of being short to begin with.
            const desc = site.description.length > 200
              ? site.description.slice(0, 200) + "…"
              : site.description;

            const isFav = exploreFavSet.has(site.id);
            const voters = exploreVotesBySite.get(site.id) ?? [];
            return (
              // Reuses the exact same map-popup / mp-* classes the Explore map popup
              // uses (defined in MapView.tsx's POPUP_STYLE) so a card and its popup are
              // structurally identical — same row order, same badge/name/actions
              // treatment. Width/sizing is overridden inline since map-popup's own
              // min/max-width is sized for a floating Leaflet popup, not a grid cell.
              <div
                key={site.id}
                className="map-popup transition-shadow hover:shadow-lg"
                style={{ width: "100%", minWidth: 0, maxWidth: "none" }}
              >
                <div className="mp-badge-row">
                  <span
                    className="mp-badge"
                    style={{ background: color + "22", color: color, border: `1px solid ${color}55` }}
                  >
                    {site.category}
                  </span>
                </div>

                {site.url ? (
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="mp-name mp-name-link">
                    {site.name}
                  </a>
                ) : (
                  <div className="mp-name">{site.name}</div>
                )}

                <div className="mp-row">
                  <span className="mp-icon">{flag}</span> {site.country}{site.region ? <> · {site.region}</> : null}
                </div>

                <div className="mp-row" style={{ marginTop: 4, lineHeight: 1.5 }}>
                  {desc}
                </div>

                {site.bestMonths && <div className="mp-months">Best: {site.bestMonths}</div>}

                <div className="mp-actions">
                  <button
                    className={`mp-star-btn ${isFav ? "starred" : ""}`}
                    onClick={() => onToggleExploreFav(site.id)}
                    disabled={exploreFavPending}
                  >
                    {isFav ? "★ Voted" : "☆ Vote"}
                  </button>
                  {voters.length > 0 && <VoterChips voters={voters} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
