import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const VOTER_COLORS = [
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
];

interface Props {
  voters: string[];
  compact?: boolean; // kept for call-site compatibility; rendering is identical either way
}

export default function VoterChips({ voters }: Props) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  // Rendered via a portal to document.body (position: fixed, viewport coords) rather
  // than as a normal absolutely-positioned child — an ancestor with overflow: auto
  // (e.g. the races table's horizontally-scrolling wrapper) clips any child that
  // extends past its own bounds, which is what made this popup render cramped/cut-off
  // before. A portal escapes that ancestor entirely so it can render over surrounding
  // content and extend further right of the button instead of being squeezed against it.
  const updatePosition = React.useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const popupWidth = popupRef.current?.offsetWidth ?? 160;
    const left = Math.min(rect.left, window.innerWidth - popupWidth - 8);
    setPos({ top: rect.bottom + 6, left: Math.max(8, left) });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();
    function handleClickAway(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickAway);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  if (voters.length === 0) return <span className="text-muted-foreground/30 text-xs">—</span>;

  return (
    <>
      <button
        ref={btnRef}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-400 transition-colors text-white text-xs font-bold shrink-0"
      >
        {voters.length}
      </button>
      {open && pos && createPortal(
        <div
          ref={popupRef}
          className="fixed z-[1000] min-w-[160px] rounded-xl border border-border bg-background shadow-2xl py-1.5 px-1.5"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="flex items-center justify-between px-1.5 pb-1 mb-1 border-b border-border">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{voters.length === 1 ? '1 Vote' : `${voters.length} Votes`}</span>
            <button onClick={() => setOpen(false)} className="p-0.5 -mr-0.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Close">
              <X size={12} />
            </button>
          </div>
          {voters.map((v, i) => (
            <div key={i} className={`px-2 py-0.5 mb-0.5 last:mb-0 text-[10px] font-semibold rounded-full border ${VOTER_COLORS[i % VOTER_COLORS.length]}`}>{v}</div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
