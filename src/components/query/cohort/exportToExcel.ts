import * as XLSX from "xlsx";
import { CohortResult } from "@/lib/api/schema";
import {
  CohortColumn,
  STAT_COLS,
  STAT_LABELS,
  cellFor,
  fmtStat,
  rawCellValue,
} from "./shared";

type CellRange = { s: { r: number; c: number }; e: { r: number; c: number } };

export function exportCohortToExcel(
  data: CohortResult,
  columns: CohortColumn[],
  filename = "cohort.xlsx"
) {
  const popStatsByName = new Map(data.populationStats.map((s) => [s.propertyName, s]));

  const header1: (string | number)[] = ["DT"];
  const header2: (string | number)[] = [""];
  columns.forEach((col) => {
    header1.push(col.name, ...STAT_COLS.map(() => ""));
    header2.push("Value", ...STAT_COLS.map((s) => STAT_LABELS[s]));
  });

  const popRow: (string | number)[] = ["Population"];
  columns.forEach((col) => {
    const stats = popStatsByName.get(col.name);
    popRow.push("—", ...STAT_COLS.map((s) => fmtStat(stats, s)));
  });

  const dataRows = data.rows.map((row) => {
    const cells: (string | number)[] = [row.hdtId];
    columns.forEach((col) => {
      const cell = cellFor(row, col.name);
      const value = rawCellValue(cell);
      cells.push(
        value == null ? "—" : typeof value === "boolean" ? String(value) : value,
        ...STAT_COLS.map((s) => fmtStat(cell, s))
      );
    });
    return cells;
  });

  const aoa = [header1, header2, popRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const merges: CellRange[] = [{ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }];
  let col = 1;
  columns.forEach(() => {
    merges.push({ s: { r: 0, c: col }, e: { r: 0, c: col + STAT_COLS.length } });
    col += STAT_COLS.length + 1;
  });
  ws["!merges"] = merges;

  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 2, c });
    const target = ws[addr];
    if (target) {
      target.s = { font: { bold: true } };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cohort");
  XLSX.writeFile(wb, filename);
}
