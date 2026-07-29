"use client";

import { useMemo } from "react";
import { PropertyPopulationStats } from "@/lib/api/schema";
import { COUNT_LABEL, STAT_COLS, STAT_LABELS, deriveCohortColumns, fmtCount, fmtStat } from "./shared";
import { ScrollableTable } from "@/components/common/ScrollableTable";
import { STICKY_HEADER_CELL, STICKY_HEADER_CORNER, STICKY_FIRST_COL_CELL } from "@/components/common/tableSticky";

export function PopulationStatsMatrix({
  populationStats,
  filteredPropertyNames,
}: {
  populationStats: PropertyPopulationStats[];
  filteredPropertyNames: string[];
}) {
  const columns = useMemo(
    () => deriveCohortColumns(populationStats, filteredPropertyNames),
    [populationStats, filteredPropertyNames]
  );
  const statsByName = useMemo(
    () => new Map(populationStats.map((s) => [s.propertyName, s])),
    [populationStats]
  );

  return (
    <ScrollableTable>
      <table className="w-full text-sm">
        <thead className="bg-gray-700">
          <tr>
            <th className={`px-4 py-2 text-left ${STICKY_HEADER_CORNER}`}>Property</th>
            <th className={`px-4 py-2 text-left whitespace-nowrap ${STICKY_HEADER_CELL}`}>
              {COUNT_LABEL}
            </th>
            {STAT_COLS.map((s) => (
              <th key={s} className={`px-4 py-2 text-left whitespace-nowrap ${STICKY_HEADER_CELL}`}>
                {STAT_LABELS[s]}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {columns.map((col) => {
            const stats = statsByName.get(col.name);
            return (
              <tr
                key={col.name}
                className={`group border-t border-gray-700 hover:bg-gray-700 ${
                  col.filtered ? "bg-blue-900/40" : ""
                }`}
              >
                <td
                  className={`px-4 py-2 font-semibold whitespace-nowrap group-hover:bg-gray-700 ${STICKY_FIRST_COL_CELL} ${
                    col.filtered ? "bg-blue-950" : "bg-gray-800"
                  }`}
                >
                  {col.name}
                </td>
                <td className="px-4 py-2">{fmtCount(stats)}</td>
                {STAT_COLS.map((s) => (
                  <td key={s} className="px-4 py-2">
                    {fmtStat(stats, s)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollableTable>
  );
}
