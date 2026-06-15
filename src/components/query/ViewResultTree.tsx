"use client";

import { type ReactElement } from "react";
import { Property } from "@/lib/api/schema";
import { PropertyTable } from "./PropertyTable";
import { fromProperty } from "./propertyRow";

type FlatNode = { type: "flat"; properties?: Property[] };
type GroupedNode = { type: "grouped"; key: string; buckets: [string | null, ViewNode][] };
export type ViewNode = FlatNode | GroupedNode;

export function ViewResultTree({
  resultsByHdt,
}: {
  resultsByHdt: Record<string, ViewNode>;
}): ReactElement {
  const entries = Object.entries(resultsByHdt);

  if (entries.length === 0) {
    return (
      <div className="p-4 bg-gray-700 rounded-lg text-gray-400 text-center">
        No results.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map(([key, node]) => (
        <div key={key} className="bg-gray-700 rounded-lg p-4">
          <div className="text-base font-bold text-white mb-3">{key}</div>
          {node.type === "flat" ? (
            <PropertyTable rows={(node.properties ?? []).map(fromProperty)} />
          ) : (
            <div className="mt-1">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
                grouped by: {node.key}
              </div>
              <ViewResultTree
                resultsByHdt={Object.fromEntries(
                  node.buckets.map(([bucketKey, bucketResult]) => [
                    bucketKey ?? "(untagged)",
                    bucketResult as unknown as ViewNode,
                  ])
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
