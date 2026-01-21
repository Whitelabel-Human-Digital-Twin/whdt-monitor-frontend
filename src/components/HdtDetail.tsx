"use client";

import { emptyStatusResponse, HdtStatusResponse, PropertyResponse } from "@/types/hdt";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Filter } from "./Filter";

interface HdtDetailProps {
  id: string;
}

export default function HdtDetail({ id }: HdtDetailProps) {
  const [state, setState] = useState<HdtStatusResponse>(emptyStatusResponse());
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [search, setSearch] = useState("");

  const fetchState = async () => {
    try {
      const res = await fetch(`/api/hdt/${id}/state`);
      const data: HdtStatusResponse = await res.json();
      setState(data);
      console.log("Fetched state: ", data)
    } catch (err) {
      console.error("Failed to fetch DT state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();

    const interval = setInterval(() => {
      fetchState();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [id]);

    const filteredProperties = state.properties.filter((prop: PropertyResponse) => {
      const q = search.trim();
      if (!q) return true;

      try {
        const regex = new RegExp(q, "i");
      return regex.test(prop.key);
      } catch {
      return true;
      }
    });

  return (
    <div className="bg-gray-900 text-white p-4 rounded shadow w-full">
      <h2 className="font-bold text-lg mb-2">State of {id}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <Filter
            value={search}
            onChange={setSearch}
            placeholder="Search property..."
            className="mb-4 p-2 border border-gray-700 rounded bg-gray-900 text-white w-full"
          />

        <table className="w-full text-sm text-left border border-gray-600 mt-2 text-white">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="p-2 border border-gray-600">Key</th>
              <th className="p-2 border border-gray-600">Value</th>
              <th className="p-2 border border-gray-600">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredProperties.map((prop: PropertyResponse) => {
              const valueMap = prop.value.valueMap

              const timestamp = valueMap["timestamp"]
                ? new Date(valueMap["timestamp"].value as number).toLocaleString()
                : "—";

              const valueString = Object.entries(valueMap)
                //filter out timestamp value as we already got it
                .filter(([k]) => !["timestamp",].includes(k))
                .map(([k, v]) => `${k}: ${v.value}`)
                .join(", ");

              return (
                <tr 
                  key={prop.key} 
                  className="bg-gray-900 hover:bg-gray-800"
                  onClick={() => router.push(`/hdt/${id}/property-live`)}
                >
                  <td className="p-2 border border-gray-700">{prop.key}</td>
                  <td className="p-2 border border-gray-700">{valueString || "—"}</td>
                  <td className="p-2 border border-gray-700">{timestamp}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}
