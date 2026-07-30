"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Filter } from "./Filter";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { HdtSpecResponse, PropertySpecEntry, PropertyValue, TaskPropertySnapshotEntry } from "@/lib/api/schema";
import PropertyTagEditor from "./PropertyTagEditor";
import { byOrdinalThenName } from "@/util/utils";

interface HdtDetailProps {
  id: string;
  entries: TaskPropertySnapshotEntry[];
  spec: HdtSpecResponse;
  onTagSaved?: () => void;
}

type DisplayRow = {
  modelName: string;
  propertyId: string;
  propertyName: string;
  value: PropertyValue;
  timestamp: string;
  tags: Record<string, string>;
  declaredType?: string;
  ordinal: number;
};

function formatPropertyValue(row: DisplayRow): string {
  const raw = row.value != null ? (row.value as { value?: unknown }).value : undefined;
  if (raw == null) return "—";
  if (
    (row.declaredType === "FLOAT" || row.declaredType === "DOUBLE") &&
    typeof raw === "number"
  ) {
    const decimals = row.modelName.toLowerCase() === "info" ? 1 : 2;
    return raw.toFixed(decimals);
  }
  return String(raw);
}

export default function HdtDetail({ id, entries, spec, onTagSaved }: HdtDetailProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedModelName, setSelectedModelName] = useState<string>("All");
  const [editorTarget, setEditorTarget] = useState<DisplayRow | null>(null);

  const specByPropertyId = useMemo(() => {
    const m = new Map<string, PropertySpecEntry>();
    for (const model of spec.models) {
      for (const p of model.properties) m.set(p.propertyId, p);
    }
    return m;
  }, [spec]);

  const displayRows: DisplayRow[] = useMemo(() => {
    return entries
      .map((e) => {
        const sp = specByPropertyId.get(e.propertyId);
        return {
          modelName: e.modelName,
          propertyId: e.propertyId,
          propertyName: e.propertyName,
          value: e.value,
          timestamp: e.timestamp,
          tags: sp?.tags ?? {},
          declaredType: sp?.declaredType,
          ordinal: sp?.ordinal ?? -1,
        };
      })
      .sort(byOrdinalThenName);
  }, [entries, specByPropertyId]);

  const modelNamesInScope = useMemo(
    () => Array.from(new Set(displayRows.map((r) => r.modelName))),
    [displayRows]
  );

  const effectiveModel = modelNamesInScope.includes(selectedModelName) ? selectedModelName : "All";

  const filteredRows = useMemo(() => {
    return displayRows.filter((row) => {
      const matchesModel = effectiveModel === "All" || row.modelName === effectiveModel;
      if (!matchesModel) return false;
      const q = search.trim();
      if (!q) return true;
      try {
        return new RegExp(q, "i").test(row.propertyName);
      } catch {
        return true;
      }
    });
  }, [displayRows, effectiveModel, search]);

  return (
    <div className="bg-gray-900 text-white p-4 rounded shadow w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-lg">State of {id}</h2>
      </div>

      {modelNamesInScope.length > 1 && (
        <div className="w-full overflow-hidden">
          <Tabs
            value={effectiveModel}
            onChange={(_, newValue) => setSelectedModelName(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              maxWidth: "100%",
              minHeight: 40,
              "& .MuiTabs-scroller": {
                overflowX: "auto !important",
              },
              "& .MuiTab-root": {
                color: "#d1d5db",
                textTransform: "none",
                minHeight: 40,
              },
              "& .Mui-selected": {
                color: "#fff",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#60a5fa",
              },
              "& .MuiTabs-scrollButtons": {
                color: "#d1d5db",
              },
            }}
          >
            <Tab value="All" label="All" />
            {modelNamesInScope.map((name) => (
              <Tab key={name} value={name} label={name} />
            ))}
          </Tabs>
        </div>
      )}

      <Filter
        value={search}
        onChange={setSearch}
        placeholder="Search property..."
        className="mb-4 p-2 border border-gray-700 rounded bg-gray-900 text-white w-full"
      />

      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-sm text-left border border-gray-600 mt-2 text-white">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-2 border border-gray-600">Model</th>
              <th className="p-2 border border-gray-600">Property</th>
              <th className="p-2 border border-gray-600">Value</th>
              <th className="p-2 border border-gray-600">Timestamp</th>
              <th className="p-2 border border-gray-600">Tags</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={row.propertyId}
                className="bg-gray-900 hover:bg-gray-800"
                onClick={() => router.push(`/hdt/${id}/property-live`)}
              >
                <td className="p-2 border border-gray-700">{row.modelName}</td>
                <td className="p-2 border border-gray-700">{row.propertyName}</td>
                <td className="p-2 border border-gray-700">
                  {formatPropertyValue(row)}
                </td>
                <td className="p-2 border border-gray-700">
                  {row.timestamp ? new Date(row.timestamp).toDateString() : "—"}
                </td>
                <td className="p-2 border border-gray-700">
                  <button
                    className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs"
                    onClick={(e) => { e.stopPropagation(); setEditorTarget(row); }}
                  >
                    🏷 {Object.keys(row.tags).length}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editorTarget && (
        <PropertyTagEditor
          open={!!editorTarget}
          hdtId={id}
          propertyId={editorTarget.propertyId}
          propertyName={editorTarget.propertyName}
          initialTags={editorTarget.tags}
          onClose={() => setEditorTarget(null)}
          onSaved={() => { onTagSaved?.(); setEditorTarget(null); }}
        />
      )}
    </div>
  );
}
