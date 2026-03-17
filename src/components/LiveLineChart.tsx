"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { PropertyEventDocument } from "@/types/event/property_event";

interface LiveLineChartProps {
  dtId: string;
  pName: string;
  history: PropertyEventDocument[]
}

export default function LiveLineChart({ dtId, pName, history }: LiveLineChartProps) {
  const chartData = history.map((e) => {
    const pv = e.value.value
    if (typeof pv === "number") {
      return {"value": pv}
    } else {
      return {"value": null}
    }
  });
  console.log(chartData)

  if (chartData.length === 0 ) {
    return <div>No data to display</div>;
  }

  return (
  <div>
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
        <Line
            type="monotone"
            dataKey={"value"}
            stroke="#00bfff"
            strokeWidth={2}
            dot={true}
          />
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}
