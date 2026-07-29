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
import { ScrollableTable } from "@/components/common/ScrollableTable";
import {
  STICKY_HEADER_CELL,
  STICKY_HEADER_CORNER,
  STICKY_FIRST_COL_CELL,
  useMeasuredHeight,
} from "@/components/common/tableSticky";

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

  const [headerRow1Ref, headerRow1Height] = useMeasuredHeight<HTMLTableRowElement>();
  const [headerRow2Ref, headerRow2Height] = useMeasuredHeight<HTMLTableRowElement>();
  const populationRowTop = headerRow1Height + headerRow2Height;

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
      <ScrollableTable>
        <table className="w-full text-sm">
          <thead className="bg-gray-700">
            <tr ref={headerRow1Ref}>
              <th
                className={`px-4 py-2 text-left align-bottom ${STICKY_HEADER_CORNER}`}
                rowSpan={2}
              >
                DT
              </th>
              {columns.map((col) => {
                const open = expandedCols.has(col.name);
                return (
                  <th
                    key={col.name}
                    colSpan={open ? 2 + STAT_COLS.length : 1}
                    className={`px-4 py-2 text-left cursor-pointer select-none whitespace-nowrap ${STICKY_HEADER_CELL} ${
                      col.filtered ? "bg-blue-900/60" : ""
                    }`}
                    onClick={() => toggleCol(col.name)}
                  >
                    {open ? "▾" : "▸"} {col.name}
                  </th>
                );
              })}
            </tr>
            <tr ref={headerRow2Ref}>
              {columns.map((col) => {
                const open = expandedCols.has(col.name);
                return (
                  <Fragment key={col.name}>
                    <th
                      className={`px-4 py-2 text-left text-xs font-normal whitespace-nowrap ${STICKY_HEADER_CELL} ${
                        col.filtered ? "bg-blue-900/40" : ""
                      }`}
                      style={{ top: headerRow1Height }}
                    >
                      Value
                    </th>
                    {open && (
                      <th
                        className={`px-4 py-2 text-left text-xs font-normal whitespace-nowrap ${STICKY_HEADER_CELL}`}
                        style={{ top: headerRow1Height }}
                      >
                        {COUNT_LABEL}
                      </th>
                    )}
                    {open &&
                      STAT_COLS.map((s) => (
                        <th
                          key={s}
                          className={`px-4 py-2 text-left text-xs font-normal whitespace-nowrap ${STICKY_HEADER_CELL}`}
                          style={{ top: headerRow1Height }}
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
            <tr className="font-bold border-t-2 border-b-2 border-gray-500">
              <td
                className={`px-4 py-2 sticky left-0 z-[15] bg-gray-800`}
                style={{ top: populationRowTop }}
              >
                Population
              </td>
              {columns.map((col) => {
                const open = expandedCols.has(col.name);
                const stats = popStatsByName.get(col.name);
                return (
                  <Fragment key={col.name}>
                    <td
                      className="px-4 py-2 sticky z-10 bg-gray-800"
                      style={{ top: populationRowTop }}
                    >
                      —
                    </td>
                    {open && (
                      <td
                        className="px-4 py-2 sticky z-10 bg-gray-800"
                        style={{ top: populationRowTop }}
                      >
                        {fmtCount(stats)}
                      </td>
                    )}
                    {open &&
                      STAT_COLS.map((s) => (
                        <td
                          key={s}
                          className="px-4 py-2 sticky z-10 bg-gray-800"
                          style={{ top: populationRowTop }}
                        >
                          {fmtStat(stats, s)}
                        </td>
                      ))}
                  </Fragment>
                );
              })}
            </tr>

            {showRows &&
              pageRows.map((row) => (
                <tr key={row.hdtId} className="group border-t border-gray-700 hover:bg-gray-700">
                  <td
                    className={`px-4 py-2 font-mono text-xs bg-gray-800 group-hover:bg-gray-700 ${STICKY_FIRST_COL_CELL}`}
                  >
                    {row.hdtId}
                  </td>
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
      </ScrollableTable>

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
