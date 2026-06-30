// Distance pill coloring — shared by the races table and map popups so a "10K" pill
// looks identical everywhere instead of each surface inventing its own palette.
export function getDistPillClass(label: string): string {
  const l = label.trim();
  if (l === "Super Sprint") return "bg-sky-100 border-sky-400 text-sky-700 dark:bg-sky-500/15 dark:border-sky-500/50 dark:text-sky-300";
  if (l === "Sprint")       return "bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/50 dark:text-blue-300";
  if (l === "Olympic")      return "bg-violet-100 border-violet-400 text-violet-700 dark:bg-violet-500/15 dark:border-violet-500/50 dark:text-violet-300";
  if (l === "Half IM")      return "bg-orange-100 border-orange-400 text-orange-700 dark:bg-orange-500/15 dark:border-orange-500/50 dark:text-orange-300";
  if (l === "IM")           return "bg-red-100 border-red-500 text-red-700 dark:bg-red-500/15 dark:border-red-500/50 dark:text-red-300";
  if (l === "5K")  return "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/50 dark:text-emerald-300";
  if (l === "10K") return "bg-green-100 border-green-400 text-green-700 dark:bg-green-500/15 dark:border-green-500/50 dark:text-green-300";
  if (l === "21.1K" || l === "21K") return "bg-teal-100 border-teal-400 text-teal-700 dark:bg-teal-500/15 dark:border-teal-500/50 dark:text-teal-300";
  if (l === "42.2K" || l === "42K") return "bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/50 dark:text-amber-300";
  const kmMatch = l.match(/^([\d.]+)K$/);
  if (kmMatch) {
    const km = parseFloat(kmMatch[1]);
    if (km <= 10)  return "bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/50 dark:text-emerald-300";
    if (km <= 21)  return "bg-teal-100 border-teal-400 text-teal-700 dark:bg-teal-500/15 dark:border-teal-500/50 dark:text-teal-300";
    if (km <= 42)  return "bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/50 dark:text-amber-300";
    return "bg-rose-100 border-rose-400 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/50 dark:text-rose-300";
  }
  if (/Ocean|Lake|River/.test(l)) return "bg-cyan-100 border-cyan-400 text-cyan-700 dark:bg-cyan-500/15 dark:border-cyan-500/50 dark:text-cyan-300";
  if (l === "Road")    return "bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-500/15 dark:border-slate-500/50 dark:text-slate-300";
  if (l === "Trail")   return "bg-lime-100 border-lime-500 text-lime-700 dark:bg-lime-500/15 dark:border-lime-500/50 dark:text-lime-300";
  if (l === "Spartan") return "bg-red-100 border-red-500 text-red-700 dark:bg-red-500/15 dark:border-red-500/50 dark:text-red-300";
  return "bg-muted border-border text-muted-foreground";
}
