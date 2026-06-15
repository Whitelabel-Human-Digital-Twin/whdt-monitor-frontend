"use client";

import { PropertyRow } from "./propertyRow";

export function PropertyTable({ rows }: { rows: PropertyRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-4 bg-gray-700 rounded-lg text-gray-400 text-center">
        No properties found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm rounded-lg overflow-hidden shadow-md">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Model</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Tags</th>
            <th className="px-4 py-2 text-left">Coding</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-t border-gray-700 hover:bg-gray-700">
              <td className="px-4 py-2">{row.name}</td>
              <td className="px-4 py-2">{row.modelId}</td>
              <td className="px-4 py-2">{row.declaredType}</td>
              <td className="px-4 py-2">
                {Object.entries(row.tags).length > 0
                  ? Object.entries(row.tags)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ")
                  : <span className="text-gray-400">—</span>}
              </td>
              <td className="px-4 py-2">
                {row.coding
                  ? `${row.coding.system}:${row.coding.code}`
                  : <span className="text-gray-400">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
