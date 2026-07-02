import { CohortPropertyCell, CohortRow } from "@/lib/api/schema";
import { distinct } from "@/util/utils";

export const STAT_COLS = ["count", "avg", "min", "max", "median", "p25", "p75"] as const;
export type StatCol = (typeof STAT_COLS)[number];

export const STAT_LABELS: Record<StatCol, string> = {
  count: "Count",
  avg: "Avg",
  min: "Min",
  max: "Max",
  median: "Median",
  p25: "P25",
  p75: "P75",
};

export type StatBearing = {
  count: number;
  avg?: number | null;
  min?: number | null;
  max?: number | null;
  median?: number | null;
  p25?: number | null;
  p75?: number | null;
};

export const fmt = (n?: number | null) => (n == null ? "—" : n.toFixed(2));

export function fmtStat(source: StatBearing | undefined, stat: StatCol): string {
  if (!source) return "—";
  return stat === "count" ? String(source.count) : fmt(source[stat]);
}

export type CohortColumn = { name: string; filtered: boolean };

/** Columns come from populationStats (the canonical set); filtered properties surface first, in filter order. */
export function deriveCohortColumns(
  populationStats: { propertyName: string }[],
  filteredPropertyNames: string[]
): CohortColumn[] {
  const names = distinct(populationStats.map((s) => s.propertyName));
  const nameSet = new Set(names);
  const filteredOrder = distinct(filteredPropertyNames.filter((n) => nameSet.has(n)));
  const filteredSet = new Set(filteredOrder);
  const rest = names.filter((n) => !filteredSet.has(n)).sort((a, b) => a.localeCompare(b));
  return [
    ...filteredOrder.map((name) => ({ name, filtered: true })),
    ...rest.map((name) => ({ name, filtered: false })),
  ];
}

export function cellFor(row: CohortRow, propertyName: string): CohortPropertyCell | undefined {
  return row.properties.find((p) => p.propertyName === propertyName);
}

export function rawCellValue(cell?: CohortPropertyCell): string | number | boolean | undefined {
  const v = cell?.value;
  if (v && "value" in v) return v.value;
  return undefined;
}
