import * as XLSX from "xlsx";

/**
 * Writes an array-of-arrays as a CSV download. Row 0 is the header.
 *
 * Escaping is delegated to SheetJS rather than hand-rolled: a previous
 * implementation joined values with commas directly, so any value containing a
 * comma or a quote corrupted the file. A UTF-8 BOM is prepended so that the file
 * opens correctly in editors and tools that sniff encoding.
 */
export function downloadCsv(filename: string, rows: (string | number | null)[][]): void {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
