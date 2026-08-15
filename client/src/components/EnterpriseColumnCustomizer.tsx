import { useState } from "react";
import { Check, RotateCcw, SlidersHorizontal } from "lucide-react";

export type EnterpriseColumn = {
  id: string;
  label: string;
  defaultVisible?: boolean;
};

type EnterpriseColumnCustomizerProps = {
  columns: EnterpriseColumn[];
  visibleColumns: string[];
  onVisibleColumnsChange: (columns: string[]) => void;
  label?: string;
};

export function EnterpriseColumnCustomizer({ columns, visibleColumns, onVisibleColumnsChange, label = "Columns" }: EnterpriseColumnCustomizerProps) {
  const [open, setOpen] = useState(false);
  const visible = new Set(visibleColumns);
  const toggleColumn = (id: string) => {
    const next = visible.has(id) ? visibleColumns.filter((column) => column !== id) : [...visibleColumns, id];
    if (next.length) onVisibleColumnsChange(next);
  };
  const reset = () => onVisibleColumnsChange(columns.filter((column) => column.defaultVisible !== false).map((column) => column.id));

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="dialog" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        <SlidersHorizontal size={15} aria-hidden="true" />
        {label}
      </button>
      {open ? <div role="dialog" aria-label="Choose visible columns" className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between px-2 pb-2 pt-1"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Visible columns</p><button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"><RotateCcw size={12} /> Reset</button></div>
        <div className="max-h-64 overflow-y-auto">{columns.map((column) => {
          const checked = visible.has(column.id);
          return <label key={column.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 text-[12px] text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-950/30"><span>{column.label}</span><input type="checkbox" checked={checked} onChange={() => toggleColumn(column.id)} className="sr-only" /><span aria-hidden="true" className={`grid h-4 w-4 place-items-center rounded border ${checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>{checked ? <Check size={11} strokeWidth={3} /> : null}</span></label>;
        })}</div>
      </div> : null}
    </div>
  );
}
