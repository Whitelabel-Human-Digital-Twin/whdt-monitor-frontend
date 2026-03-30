"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { PropertyEventDocument } from "@/lib/api/schema";

interface LiveLineChartProps {
  dtId: string;
  pName: string;
  history: PropertyEventDocument[]
}

export default function LiveLineChart({ dtId, pName, history }: LiveLineChartProps) {
  const chartData = history

  if (chartData.length === 0 ) {
    return <div>No data to display</div>;
  }

  return (
  <div>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>

        <XAxis
          dataKey="timeField"
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
        <Line
            type="monotone"
            dataKey={"value.value"}
            stroke="#00bfff"
            strokeWidth={2}
            dot={true}
          />
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}
