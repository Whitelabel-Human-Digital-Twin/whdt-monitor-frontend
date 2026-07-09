import * as XLSX from "xlsx";
import { CohortResult } from "@/lib/api/schema";
import { CohortColumn, COUNT_LABEL, STAT_COLS, STAT_LABELS, fmtCount, fmtStat } from "./shared";

export function exportCohortToExcel(
  data: CohortResult,
  columns: CohortColumn[],
  filename = "cohort.xlsx"
) {
  const popStatsByName = new Map(data.populationStats.map((s) => [s.propertyName, s]));

  const header: (string | number)[] = ["Property", COUNT_LABEL, ...STAT_COLS.map((s) => STAT_LABELS[s])];

  const rows = columns.map((col) => {
    const stats = popStatsByName.get(col.name);
    return [col.name, fmtCount(stats), ...STAT_COLS.map((s) => fmtStat(stats, s))];
  });

  const aoa = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    const target = ws[addr];
    if (target) {
      target.s = { font: { bold: true } };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Population Stats");
  XLSX.writeFile(wb, filename);
}
