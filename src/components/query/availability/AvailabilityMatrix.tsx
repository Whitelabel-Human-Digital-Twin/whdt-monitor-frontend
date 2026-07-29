"use client";

import { HdtModelAvailability, ModelAvailability } from "@/lib/api/schema";
import { ScrollableTable } from "@/components/common/ScrollableTable";
import { STICKY_HEADER_CELL, STICKY_HEADER_CORNER, STICKY_FIRST_COL_CELL } from "@/components/common/tableSticky";

type Props = {
  data: HdtModelAvailability[];
  /** Column order; when the request had no model filter, derive from the response. */
  modelNames: string[];
};

function fmtWindow(cell: ModelAvailability): string {
  const first = new Date(cell.firstTimestamp).toLocaleString();
  const last = new Date(cell.lastTimestamp).toLocaleString();
  return `${first} – ${last}`;
}

export function AvailabilityMatrix({ data, modelNames }: Props) {
  return (
    <ScrollableTable>
      <table className="w-full text-sm">
        <thead className="bg-gray-700">
          <tr>
            <th className={`px-4 py-2 text-left ${STICKY_HEADER_CORNER}`}>DT</th>
            {modelNames.map((name) => (
              <th key={name} className={`px-4 py-2 text-left whitespace-nowrap ${STICKY_HEADER_CELL}`}>
                {name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row) => {
            const byModel = new Map(row.models.map((m) => [m.modelName, m]));
            return (
              <tr key={row.hdtId} className="border-t border-gray-700 hover:bg-gray-700">
                <td
                  className={`px-4 py-2 font-mono text-xs bg-gray-800 group-hover:bg-gray-700 ${STICKY_FIRST_COL_CELL}`}
                >
                  {row.hdtId}
                </td>
                {modelNames.map((name) => {
                  const cell = byModel.get(name);
                  return (
                    <td key={name} className="px-4 py-2 align-top">
                      {cell ? (
                        <div>
                          <div>{cell.observationCount}</div>
                          <div className="text-xs text-gray-400 whitespace-nowrap">{fmtWindow(cell)}</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollableTable>
  );
}
