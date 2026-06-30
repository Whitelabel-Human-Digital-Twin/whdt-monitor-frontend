"use client";

import { useEffect, useMemo, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { HdtSpecResponse } from "@/lib/api/schema";
import { api } from "@/lib/api/client";
import HdtDetail, { NO_TASK } from "./HdtDetail";

interface HdtTaskViewProps {
  id: string;
}

export default function HdtTaskView({ id }: HdtTaskViewProps) {
  const [spec, setSpec] = useState<HdtSpecResponse | null>(null);
  const [activeTask, setActiveTask] = useState<string | undefined>(undefined);

  const fetchSpec = async () => {
    try {
      const res = await api.GET("/hdts/{id}/spec", { params: { path: { id } } });
      setSpec(res.data ?? null);
    } catch (err) {
      console.error("Failed to fetch HDT spec for task view:", err);
    }
  };

  useEffect(() => {
    fetchSpec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { tasks, hasUntagged } = useMemo(() => {
    if (!spec) return { tasks: [] as string[], hasUntagged: false };
    const set = new Set<string>();
    let untagged = false;
    for (const model of spec.models) {
      for (const prop of model.properties) {
        const tags = prop.tags;
        if (tags && "task" in tags) set.add(tags.task);
        else untagged = true;
      }
    }
    return { tasks: Array.from(set).sort(), hasUntagged: untagged };
  }, [spec]);

  useEffect(() => {
    if (!spec) return;
    setActiveTask((prev) => {
      const stillValid =
        (prev !== undefined && prev !== NO_TASK && tasks.includes(prev)) ||
        (prev === NO_TASK && hasUntagged);
      if (stillValid) return prev;
      if (tasks.length > 0) return tasks[0];
      if (hasUntagged) return NO_TASK;
      return undefined;
    });
  }, [spec, tasks, hasUntagged]);

  if (spec === null) return <p className="text-white p-4">Loading...</p>;

  if (tasks.length === 0 && !hasUntagged) {
    return <HdtDetail id={id} spec={spec} onTagSaved={fetchSpec} />;
  }

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden">
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
          {tasks.map((t) => <Tab key={t} value={t} label={t} />)}
          {hasUntagged && <Tab value={NO_TASK} label="Untagged" />}
        </Tabs>
      </div>
      {activeTask !== undefined && (
        <HdtDetail id={id} task={activeTask} spec={spec} onTagSaved={fetchSpec} />
      )}
    </div>
  );
}
