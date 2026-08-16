import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Search, Filter, Calendar } from "lucide-react";

export function EnterpriseModuleHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
}: {
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}) {
  return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80 mb-6">
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
          {title}
        </h1>
        {description && <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>}
      </div>
      <div className="flex w-full items-center gap-3 shrink-0 flex-wrap md:w-auto">
        {secondaryActions}
        {primaryAction}
      </div>
    </div>
  );
}

export function ScrollableModuleTabs({
  tabs,
  activeTab,
  onChangeTab,
}: {
  tabs: { id: string; label: string; count?: number; icon?: any }[];
  activeTab: string;
  onChangeTab: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [tabs]);

  const scroll = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -240 : 240, behavior: "smooth" });
  };

  const selectTabAt = (index: number) => {
    const nextIndex = (index + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    onChangeTab(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
    tabRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight") { event.preventDefault(); selectTabAt(index + 1); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); selectTabAt(index - 1); }
    else if (event.key === "Home") { event.preventDefault(); selectTabAt(0); }
    else if (event.key === "End") { event.preventDefault(); selectTabAt(tabs.length - 1); }
  };

  return (
    <div className="relative flex items-center mb-6 group">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 z-10 h-8 w-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all -ml-3"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      <div
        ref={containerRef}
        onScroll={checkScroll}
        role="tablist"
        aria-label="Module views"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 w-full"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(element) => { tabRefs.current[index] = element; }}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 font-semibold"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {Icon && <Icon size={14} className={isActive ? "text-white" : "text-slate-400"} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 z-10 h-8 w-8 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all -mr-3"
          aria-label="Scroll tabs right"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

export function EnterpriseFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filterContent,
  actions,
}: {
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filterContent?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm">
      <div className="flex min-w-0 items-center gap-3 flex-1 flex-wrap">
        <div className="relative min-w-0 w-full flex-1 sm:min-w-[260px] sm:w-auto sm:flex-initial">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[13px] text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
          />
        </div>
        {filterContent}
      </div>
      {actions && <div className="flex w-full items-center gap-2 flex-wrap shrink-0 lg:w-auto">{actions}</div>}
    </div>
  );
}
