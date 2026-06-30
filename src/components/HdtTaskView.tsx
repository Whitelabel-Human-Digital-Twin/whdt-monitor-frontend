"use client";

import { useEffect, useMemo, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { HdtSpecResponse, TaskPropertySnapshotEntry } from "@/lib/api/schema";
import { api } from "@/lib/api/client";
import HdtDetail from "./HdtDetail";

export const NO_TASK = "__no_task__";

interface HdtTaskViewProps {
  id: string;
}

const taskKeyOf = (t: string | null | undefined) => (t == null ? NO_TASK : t);

export default function HdtTaskView({ id }: HdtTaskViewProps) {
  const [spec, setSpec] = useState<HdtSpecResponse | null>(null);
  const [byTask, setByTask] = useState<TaskPropertySnapshotEntry[]>([]);
  const [activeTask, setActiveTask] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSpec = async () => {
    try {
      const res = await api.GET("/hdts/{id}/spec", { params: { path: { id } } });
      setSpec(res.data ?? null);
    } catch (err) {
      console.error("Failed to fetch HDT spec:", err);
    }
  };

  const fetchByTask = async () => {
    try {
      const res = await api.GET("/hdts/{id}/snapshot/by-task", { params: { path: { id } } });
      setByTask(res.data ?? []);
    } catch (err) {
      console.error("Failed to fetch by-task snapshot:", err);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await fetchByTask();
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSpec();
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const tasks = useMemo(() => {
    const set = new Set<string>();
    for (const e of byTask) set.add(taskKeyOf(e.task));
    const real = Array.from(set).filter((t) => t !== NO_TASK).sort();
    return set.has(NO_TASK) ? [...real, NO_TASK] : real;
  }, [byTask]);

  useEffect(() => {
    setActiveTask((prev) => (prev !== undefined && tasks.includes(prev) ? prev : tasks[0]));
  }, [tasks]);

  const activeEntries = useMemo(
    () => (activeTask === undefined ? [] : byTask.filter((e) => taskKeyOf(e.task) === activeTask)),
    [byTask, activeTask]
  );

  if (spec === null) return <p className="text-white p-4">Loading...</p>;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="overflow-hidden">
          {tasks.length > 0 ? (
            <Tabs
              value={activeTask ?? false}
              onChange={(_, v) => setActiveTask(v)}
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
              {tasks.map((t) => (
                <Tab key={t} value={t} label={t === NO_TASK ? "Untagged" : t} />
              ))}
            </Tabs>
          ) : (
            <p className="text-gray-400">No observations recorded for this HDT yet.</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lastUpdated && (
            <span className="text-xs text-gray-400">Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button
            onClick={refresh}
            disabled={refreshing}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </div>
      {activeTask !== undefined && (
        <HdtDetail id={id} entries={activeEntries} spec={spec} onTagSaved={fetchSpec} />
      )}
    </div>
  );
}
