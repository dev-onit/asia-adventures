import { useState, useMemo } from "react";
import type { ExploreSite } from "../../../shared/schema";
import { COUNTRY_WEATHER } from "../lib/raceGeo";

interface Props {
  sites: ExploreSite[];
  filteredSites: ExploreSite[];
  showFavsOnly: boolean;
  favCountries: Set<string>;
  hasActiveFilters: boolean;
  stickyTop?: string;
}

export default function ExploreSection({ sites, filteredSites, showFavsOnly, hasActiveFilters, stickyTop }: Props) {
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

      {/* Tile grid */}
      {isExpanded && (
        <div className="p-3 sm:p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
          {filteredSites.map(site => {
            const flag = COUNTRY_WEATHER[site.country]?.flag ?? "";
            const catColor = {
              Mountains: "text-orange-400", Islands: "text-cyan-400", Cities: "text-violet-400",
              Temples: "text-amber-400", Nature: "text-green-400", Beaches: "text-pink-400",
            }[site.category] ?? "text-muted-foreground";
            return (
              <div key={site.id} className="rounded-xl border border-border bg-card p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">{site.emoji}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${catColor}`}>{site.category}</span>
                </div>
                <div className="font-semibold text-sm text-foreground leading-snug">{site.name}</div>
                <div className="text-xs text-muted-foreground">{flag} {site.country}{site.region ? ` · ${site.region}` : ""}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{site.description}</div>
                <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                  {site.bestMonths && (
                    <span className="text-xs text-primary/70">✦ {site.bestMonths}</span>
                  )}
                  {site.url && (
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline ml-auto">↗ Visit</a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
