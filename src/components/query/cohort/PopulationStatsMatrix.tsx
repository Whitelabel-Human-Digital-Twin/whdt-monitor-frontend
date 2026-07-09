"use client";

import { useMemo } from "react";
import { PropertyPopulationStats } from "@/lib/api/schema";
import { COUNT_LABEL, STAT_COLS, STAT_LABELS, deriveCohortColumns, fmtCount, fmtStat } from "./shared";

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
    <div className="overflow-x-auto rounded-lg shadow-md">
      <table className="w-full text-sm">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Property</th>
            <th className="px-4 py-2 text-left whitespace-nowrap">{COUNT_LABEL}</th>
            {STAT_COLS.map((s) => (
              <th key={s} className="px-4 py-2 text-left whitespace-nowrap">
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
                className={`border-t border-gray-700 hover:bg-gray-700 ${
                  col.filtered ? "bg-blue-900/40" : ""
                }`}
              >
                <td className="px-4 py-2 font-semibold whitespace-nowrap">{col.name}</td>
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
    </div>
  );
}
