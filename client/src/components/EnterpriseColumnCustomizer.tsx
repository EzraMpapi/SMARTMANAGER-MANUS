import { useEffect, useRef, useState } from "react";
import { Check, Columns3 } from "lucide-react";

export type EnterpriseTableColumn = { id: string; label: string; required?: boolean };

type EnterpriseColumnCustomizerProps = {
  columns: EnterpriseTableColumn[];
  visibleColumns: string[];
  onVisibleColumnsChange: (columnIds: string[]) => void;
  label?: string;
};

export function EnterpriseColumnCustomizer({ columns, visibleColumns, onVisibleColumnsChange, label = "Columns" }: EnterpriseColumnCustomizerProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsidePointer = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", closeOnOutsidePointer);
    return () => document.removeEventListener("mousedown", closeOnOutsidePointer);
  }, [open]);

  const toggleColumn = (column: EnterpriseTableColumn) => {
    if (column.required) return;
    const isVisible = visibleColumns.includes(column.id);
    const next = isVisible ? visibleColumns.filter((id) => id !== column.id) : [...visibleColumns, column.id];
    if (next.length) onVisibleColumnsChange(next);
  };

  return <div ref={panelRef} className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"><Columns3 size={15} /> {label}</button>
    {open && <div role="menu" aria-label="Visible table columns" className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_36px_rgba(15,23,42,.16)]">
      <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Visible columns</p>
      {columns.map((column) => {
        const selected = visibleColumns.includes(column.id);
        return <button key={column.id} type="button" role="menuitemcheckbox" aria-checked={selected} disabled={column.required} onClick={() => toggleColumn(column)} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[12px] font-medium text-slate-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"><span className={`grid h-4 w-4 place-items-center rounded border ${selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"}`}>{selected && <Check size={11} strokeWidth={3} />}</span>{column.label}{column.required && <span className="ml-auto text-[10px] text-slate-400">Required</span>}</button>;
      })}
    </div>}
  </div>;
}
