"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { PropertyObservationDocument } from "@/lib/api/schema";

export type AgeUnit = "months" | "years";

export const ALL_TASKS = "all";

interface LiveLineChartProps {
  dtId: string;
  pName: string;
  history: PropertyObservationDocument[];
  taskFilter: string;
  ageUnit: AgeUnit;
}

// Age values (months, or years once converted) stay well under this bound;
// epoch timestamps used as the timeField fallback are always far above it.
const EPOCH_MAGNITUDE_THRESHOLD = 1e6;

function parseAgeMonths(observation: PropertyObservationDocument): number | null {
  const raw = observation.metadata?.age;
  if (raw === undefined) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractValue(observation: PropertyObservationDocument): number | null {
  const value = observation.value as { value?: unknown } | undefined;
  const raw = value?.value;
  if (typeof raw === "number") return raw;
  if (typeof raw === "boolean") return Number(raw);
  return null;
}

function formatAge(ageMonths: number, unit: AgeUnit): string {
  const converted = unit === "years" ? ageMonths / 12 : ageMonths;
  return `${converted.toFixed(1)} ${unit === "years" ? "yr" : "mo"}`;
}

export default function LiveLineChart({ history, taskFilter, ageUnit }: LiveLineChartProps) {
  const chartData = useMemo(() => {
    const filtered = taskFilter === ALL_TASKS
      ? history
      : history.filter((obs) => obs.metadata?.task === taskFilter);

    const points = filtered.map((obs) => {
      const ageMonths = parseAgeMonths(obs);
      const hasAge = ageMonths !== null;
      const x = hasAge ? ageMonths! : new Date(obs.timeField).getTime();
      return {
        x: hasAge && ageUnit === "years" ? x / 12 : x,
        hasAge,
        ageMonths,
        timeField: obs.timeField,
        task: obs.metadata?.task ?? null,
        value: extractValue(obs),
      };
    });

    return points.sort((a, b) => a.x - b.x);
  }, [history, taskFilter, ageUnit]);

  if (chartData.length === 0) {
    return <div>No data to display</div>;
  }

  const latest = chartData[chartData.length - 1];

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="x"
            type="number"
            domain={["dataMin", "dataMax"]}
            stroke="#ccc"
            tickFormatter={(x: number) =>
              x > EPOCH_MAGNITUDE_THRESHOLD
                ? new Date(x).toLocaleTimeString()
                : `${x.toFixed(1)} ${ageUnit === "years" ? "yr" : "mo"}`
            }
          />
          <YAxis stroke="#ccc" />
          <Tooltip
            labelFormatter={(x: number, payload) => {
              const point = payload?.[0]?.payload as (typeof chartData)[number] | undefined;
              if (point?.hasAge) return `Age: ${formatAge(point.ageMonths!, ageUnit)}`;
              return new Date(x).toLocaleString();
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#00bfff"
            strokeWidth={2}
            dot={true}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 text-sm text-gray-300 flex flex-wrap gap-6">
        <span>Latest value: <span className="text-white">{latest.value ?? "—"}</span></span>
        <span>
          Age: <span className="text-white">
            {latest.ageMonths !== null ? formatAge(latest.ageMonths, ageUnit) : "—"}
          </span>
        </span>
        <span>Task: <span className="text-white">{latest.task ?? "—"}</span></span>
      </div>
    </div>
  );
}
