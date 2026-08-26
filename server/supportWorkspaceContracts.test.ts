import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");

describe("support workspace truthfulness contracts", () => {
  it("uses confirmed lifecycle metrics rather than a fabricated average handle-time value", () => {
    expect(source).toContain('import { calculateSupportMetrics } from "./lib/supportMetrics";');
    expect(source).toContain("const supportMetrics = useMemo(() => calculateSupportMetrics(tickets.rows), [tickets.rows]);");
    expect(source).not.toContain('{ label: "Avg Handle Time", value: "8 min"');
  });

  it("renders neutral KPI feedback when confirmed support data is loading, unavailable, or missing lifecycle timing", () => {
    expect(source).toContain('const neutral = item.trend === "neutral";');
    expect(source).toContain('trend: metricState === "ready" && supportMetrics.avgHandleMinutes !== null ? undefined : "neutral"');
    expect(source).toContain('"No resolved tickets with timestamps"');
  });

  it("uses the protected, debounced support search query for multi-character live searches", () => {
    expect(source).toContain('const debouncedQuery = useDebounce(query.trim(), 250);');
    expect(source).toContain('const shouldSearchServer = IS_CONFIGURED && debouncedQuery.length >= 2;');
    expect(source).toContain('const searchedTickets = trpc.support.searchTickets.useQuery(');
    expect(source).toContain('{ enabled: shouldSearchServer, staleTime: 15_000 }');
    expect(source).toContain('title="Tickets could not be loaded" hint={queryError.message');
    expect(source).toContain('No confirmed tickets match "{query}"');
  });
});
