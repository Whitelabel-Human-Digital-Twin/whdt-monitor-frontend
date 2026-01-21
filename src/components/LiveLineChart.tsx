"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useMqtt } from "@/context/MqttContext";
import { useState } from "react";

interface LiveLineChartProps {
  dtId: string;
  propertyType: string;
}

export default function LiveLineChart({ dtId, propertyType }: LiveLineChartProps) {
  const { history } = useMqtt();
  const [minutes, setMinutes] = useState(5);
  const propertyHistory = history[dtId]?.[propertyType] ?? [];

  const cutoff = Date.now() - minutes * 60 * 1000;

  const filteredHistory = propertyHistory.filter((e) => {
    const ts = e.value.valueMap["timestamp"]?.value;
    return typeof ts === "number" && ts >= cutoff;
  });


  const chartData = filteredHistory.map((e) => {
    const values: Record<string, number> = {};

    for (const [k, v] of Object.entries(e.value.valueMap)) {
      if (v && typeof v.value === "number") {
        values[k] = v.value;
      }
    }

    return values; // timestamp included from valueMap["timestamp"]
  });

  const keys: string[] = [];

  // Define keys manually for known propertyTypes
  switch (propertyType) {
    case "blood-pressure": {
      keys.push("systolic", "diastolic");
      break;
    }
    case "heart-rate": {
      keys.push("bpm");
      break;
    }
    case "mood": {
      keys.push("moodScore");
      break;
    }
    default: {
      // Auto-extract keys from first sample (excluding "timestamp")
      if (chartData.length > 0) {
        for (const key of Object.keys(chartData[0])) {
          if (key !== "timestamp") keys.push(key);
        }
      }
    }
  }

  if (chartData.length === 0 || keys.length === 0) {
    return <div>No data to display</div>;
  }

  return (
  <div>
    <div className="mb-4">
      <label className="text-white mr-2">Last minutes:</label>
      <input
        type="number"
        min={1}
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
        className="p-2 border border-gray-700 rounded bg-gray-900 text-white w-24"
      />
    </div>

    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>

        <XAxis
          dataKey="timestamp"
          stroke="#ccc"
          tickFormatter={(ts) =>
            typeof ts === "number"
              ? new Date(ts).toLocaleTimeString()
              : ts
          }
        />
        <YAxis stroke="#ccc" />
        <Tooltip
          labelFormatter={(ts) =>
            typeof ts === "number"
              ? new Date(ts).toLocaleTimeString()
              : ts
          }
        />
        {keys.map((k) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            stroke="#00bfff"
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}
