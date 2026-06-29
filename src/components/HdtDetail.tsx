"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Filter } from "./Filter";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { HdtSpecResponse, PropertySnapshotEntry, PropertyValue } from "@/lib/api/schema";
import { api } from "@/lib/api/client";
import PropertyTagEditor from "./PropertyTagEditor";

export const NO_TASK = "__no_task__";

interface HdtDetailProps {
  id: string;
  task?: string;
}

type DisplayRow = {
  modelName: string;
  propertyId: string;
  propertyName: string;
  value: PropertyValue | null | undefined;
  timestamp: string | null | undefined;
  tags: Record<string, string>;
};

export default function HdtDetail({ id, task }: HdtDetailProps) {
  const [spec, setSpec] = useState<HdtSpecResponse | null>(null);
  const [snapshot, setSnapshot] = useState<PropertySnapshotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedModelName, setSelectedModelName] = useState<string>("All");
  const [editorTarget, setEditorTarget] = useState<DisplayRow | null>(null);

  const fetchSpec = async () => {
    try {
      const res = await api.GET("/hdts/{id}/spec", {
        params: {
          path: { id }
        }
      });
      const data = res.data;
      if (data) {
        setSpec(data);
        setSelectedModelName((prev) =>
          prev === "All" || data.models.some((m) => m.modelName === prev) ? prev : "All"
        );
      }
    } catch (err) {
      console.error("Failed to fetch HDT spec:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSnapshot = async () => {
    try {
      const res = await api.GET("/hdts/{id}/snapshot", {
        params: {
          path: { id }
        }
      });
      setSnapshot(res.data ?? []);
    } catch (err) {
      console.error("Failed to fetch HDT snapshot:", err);
    }
  };

  useEffect(() => {
    fetchSpec();
    fetchSnapshot();

    const interval = setInterval(() => {
      fetchSnapshot();
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const displayRows: DisplayRow[] = useMemo(() => {
    if (!spec) return [];
    const snapshotMap = new Map(snapshot.map((s) => [s.propertyId, s]));
    return spec.models.flatMap((model) =>
      model.properties.map((prop) => {
        const obs = snapshotMap.get(prop.propertyId);
        return {
          modelName: model.modelName,
          propertyId: prop.propertyId,
          propertyName: prop.propertyName,
          value: obs?.value ?? prop.initialValue,
          timestamp: obs?.timestamp ?? null,
          tags: prop.tags ?? {},
        };
      })
    );
  }, [spec, snapshot]);

  const taskScopedRows = useMemo(() => {
    if (task === undefined) return displayRows;
    if (task === NO_TASK) return displayRows.filter((r) => !("task" in r.tags));
    return displayRows.filter((r) => r.tags.task === task);
  }, [displayRows, task]);

  const modelNamesInScope = useMemo(
    () => Array.from(new Set(taskScopedRows.map((r) => r.modelName))),
    [taskScopedRows]
  );

  useEffect(() => {
    setSelectedModelName("All");
  }, [task]);

  const filteredRows = useMemo(() => {
    return taskScopedRows.filter((row) => {
      const matchesModel =
        selectedModelName === "All" || row.modelName === selectedModelName;

      if (!matchesModel) return false;

      const q = search.trim();
      if (!q) return true;

      try {
        const regex = new RegExp(q, "i");
        return regex.test(row.propertyName);
      } catch {
        return true;
      }
    });
  }, [taskScopedRows, selectedModelName, search]);

  return (
    <div className="bg-gray-900 text-white p-4 rounded shadow w-full">
      <h2 className="font-bold text-lg mb-2">State of {id}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="w-full overflow-hidden">
            <Tabs
              value={selectedModelName}
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
                      {row.value != null
                        ? String((row.value as { value?: unknown }).value ?? "—")
                        : "—"}
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
              onSaved={() => { fetchSpec(); setEditorTarget(null); }}
            />
          )}
        </>
      )}
    </div>
  );
}
