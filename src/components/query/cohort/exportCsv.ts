import { CohortResult } from "@/lib/api/schema";
import { rawCellValue } from "./shared";

const PER_DT_CSV_HEADER = [
  "hdtId",
  "propertyName",
  "value",
  "count",
  "avg",
  "min",
  "max",
  "median",
  "p25",
  "p75",
];

function csvValue(v: string | number | boolean | undefined): string | number | null {
  if (v === undefined) return null;
  if (typeof v === "boolean") return String(v);
  return v;
}

/** One row per twin x property present on that twin; long format. */
export function buildPerDtCsvRows(data: CohortResult): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [PER_DT_CSV_HEADER];
  for (const row of data.rows) {
    for (const cell of row.properties) {
      rows.push([
        row.hdtId,
        cell.propertyName,
        csvValue(rawCellValue(cell)),
        cell.count,
        cell.avg ?? null,
        cell.min ?? null,
        cell.max ?? null,
        cell.median ?? null,
        cell.p25 ?? null,
        cell.p75 ?? null,
      ]);
    }
  }
  return rows;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatLocalTimestamp(d: Date): string {
  const date = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  const time = `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  return `${date}-${time}`;
}

/** taskScope is sent as a one-element array in the request; several entries are joined for the filename. */
export function buildPerDtCsvFilename(taskScope: string[] | undefined, now = new Date()): string {
  const task = !taskScope || taskScope.length === 0 ? "all-tasks" : taskScope.join("-");
  const sanitized = task.replace(/[^A-Za-z0-9._-]/g, "_");
  return `cohort-per-dt_${sanitized}_${formatLocalTimestamp(now)}.csv`;
}
