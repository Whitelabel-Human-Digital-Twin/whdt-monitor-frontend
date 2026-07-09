"use client";

import { Fragment, useMemo, useState } from "react";
import { CohortResult } from "@/lib/api/schema";
import {
  COUNT_LABEL,
  STAT_COLS,
  STAT_LABELS,
  cellFor,
  deriveCohortColumns,
  fmtCount,
  fmtStat,
  rawCellValue,
} from "./shared";

const ROWS_PER_PAGE = 25;

export function CohortTable({
  data,
  filteredPropertyNames,
}: {
  data: CohortResult;
  filteredPropertyNames: string[];
}) {
  const columns = useMemo(
    () => deriveCohortColumns(data.populationStats, filteredPropertyNames),
    [data.populationStats, filteredPropertyNames]
  );
  const popStatsByName = useMemo(
    () => new Map(data.populationStats.map((s) => [s.propertyName, s])),
    [data.populationStats]
  );

  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set());
  const [showRows, setShowRows] = useState(false);
  const [page, setPage] = useState(0);

  const toggleCol = (name: string) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalPages = Math.max(1, Math.ceil(data.rows.length / ROWS_PER_PAGE));
  const pageRows = data.rows.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);

  return (
    <div>
      <div className="overflow-auto max-h-[70vh] rounded-lg shadow-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left align-bottom" rowSpan={2}>
                DT
              </th>
              {columns.map((col) => {
                const open = expandedCols.has(col.name);
                return (
                  <th
                    key={col.name}
                    colSpan={open ? 2 + STAT_COLS.length : 1}
                    className={`px-4 py-2 text-left cursor-pointer select-none whitespace-nowrap ${
                      col.filtered ? "bg-blue-900/60" : ""
                    }`}
                    onClick={() => toggleCol(col.name)}
                  >
                    {open ? "▾" : "▸"} {col.name}
                  </th>
                );
              })}
            </tr>
            <tr>
              {columns.map((col) => {
                const open = expandedCols.has(col.name);
                return (
                  <Fragment key={col.name}>
                    <th
                      className={`px-4 py-2 text-left text-xs font-normal whitespace-nowrap ${
                        col.filtered ? "bg-blue-900/40" : ""
                      }`}
                    >
                      Value
                    </th>
                    {open && (
                      <th className="px-4 py-2 text-left text-xs font-normal whitespace-nowrap">
                        {COUNT_LABEL}
                      </th>
                    )}
                    {open &&
                      STAT_COLS.map((s) => (
                        <th
                          key={s}
                          className="px-4 py-2 text-left text-xs font-normal whitespace-nowrap"
                        >
                          {STAT_LABELS[s]}
                        </th>
                      ))}
                  </Fragment>
                );
              })}
            </tr>
          </thead>

          <tbody>
            <tr className="sticky top-0 z-10 bg-gray-800 font-bold border-t-2 border-b-2 border-gray-500">
              <td className="px-4 py-2">Population</td>
              {columns.map((col) => {
                const open = expandedCols.has(col.name);
                const stats = popStatsByName.get(col.name);
                return (
                  <Fragment key={col.name}>
                    <td className="px-4 py-2">—</td>
                    {open && <td className="px-4 py-2">{fmtCount(stats)}</td>}
                    {open &&
                      STAT_COLS.map((s) => (
                        <td key={s} className="px-4 py-2">
                          {fmtStat(stats, s)}
                        </td>
                      ))}
                  </Fragment>
                );
              })}
            </tr>

            {showRows &&
              pageRows.map((row) => (
                <tr key={row.hdtId} className="border-t border-gray-700 hover:bg-gray-700">
                  <td className="px-4 py-2 font-mono text-xs">{row.hdtId}</td>
                  {columns.map((col) => {
                    const open = expandedCols.has(col.name);
                    const cell = cellFor(row, col.name);
                    const value = rawCellValue(cell);
                    return (
                      <Fragment key={col.name}>
                        <td className="px-4 py-2">{value == null ? "—" : String(value)}</td>
                        {open && <td className="px-4 py-2">{fmtCount(cell)}</td>}
                        {open &&
                          STAT_COLS.map((s) => (
                            <td key={s} className="px-4 py-2">
                              {fmtStat(cell, s)}
                            </td>
                          ))}
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4 flex-wrap">
        <button
          onClick={() => {
            setShowRows((v) => !v);
            setPage(0);
          }}
          className="bg-gray-600 hover:bg-gray-500 transition px-4 py-2 rounded text-sm font-semibold"
        >
          {showRows ? "Hide" : "Show"} individual DTs (n={data.rows.length})
        </button>

        {showRows && totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1 bg-gray-700 rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-3 py-1 bg-gray-700 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
