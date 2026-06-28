import { useState } from "react";
import { Star } from "lucide-react";
import type { ExploreSite } from "../../../shared/schema";
import { COUNTRY_WEATHER } from "../lib/raceGeo";

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

export default function ExploreSection({ sites, filteredSites, showFavsOnly, hasActiveFilters, stickyTop, exploreFavSet, onToggleExploreFav, exploreFavPending }: Props) {
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
            const desc = site.description.length > 90
              ? site.description.slice(0, 90) + "…"
              : site.description;

            const isFav = exploreFavSet.has(site.id);
            return (
              <div
                key={site.id}
                className="rounded-[14px] border border-border bg-card flex flex-col transition-all duration-150 hover:border-primary/30 hover:shadow-md"
                style={{ padding: "12px" }}
              >
                {/* Category badge + favourite star */}
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.06em] rounded-full"
                    style={{
                      padding: "2px 8px",
                      background: color + "22",
                      color: color,
                      border: `1px solid ${color}55`,
                    }}
                  >
                    {site.category}
                  </span>
                  <button
                    onClick={() => onToggleExploreFav(site.id)}
                    disabled={exploreFavPending}
                    className={`star-btn -mt-1 -mr-1 ${isFav ? "starred" : "hover:text-yellow-400/70"} disabled:opacity-50`}
                    title={isFav ? "Unstar" : "Star as favourite"}
                  >
                    <Star size={14} className={isFav ? "fill-yellow-400 text-yellow-400" : ""} />
                  </button>
                </div>

                {/* Emoji + Name */}
                <div className="flex items-start gap-1.5 mb-1">
                  <span className="text-xl leading-none mt-0.5 shrink-0">{site.emoji}</span>
                  <span className="text-sm font-bold leading-snug text-foreground">{site.name}</span>
                </div>

                {/* Country / region row */}
                <div className="text-[11px] text-muted-foreground mb-1">
                  {flag} {site.country}{site.region ? ` · ${site.region}` : ""}
                </div>

                {/* Description */}
                <div className="text-[11px] text-muted-foreground leading-relaxed mb-2 flex-1">
                  {desc}
                </div>

                {/* Best months */}
                {site.bestMonths && (
                  <div className="text-[11px] font-semibold text-primary mb-2">
                    Best: {site.bestMonths}
                  </div>
                )}

                {/* Visit button — exact popup style */}
                {site.url && (
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-xs font-bold rounded-lg transition-colors"
                    style={{
                      padding: "6px 12px",
                      border: `1px solid hsl(var(--primary) / 0.6)`,
                      background: `hsl(var(--primary) / 0.15)`,
                      color: `hsl(var(--primary))`,
                      textDecoration: "none",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "hsl(var(--primary) / 0.25)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "hsl(var(--primary) / 0.15)")}
                  >
                    ↗ Visit
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
