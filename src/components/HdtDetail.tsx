"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Filter } from "./Filter";
import { PropertyEventDocument } from "@/types/event/property_event";
import { ModelDocument } from "@/types/model/model";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

interface HdtDetailProps {
  id: string;
}

export default function HdtDetail({ id }: HdtDetailProps) {
  const [state, setState] = useState<PropertyEventDocument[]>([]);
  const [models, setModels] = useState<ModelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedModelName, setSelectedModelName] = useState<string>("All");

  const fetchState = async () => {
    try {
      const res = await fetch(`/api/persistence/hdts/${id}/events`);
      const data = await res.json();
      setState(data);
      console.log("Fetched state: ", data)
    } catch (err) {
      console.error("Failed to fetch DT state:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch(`/api/persistence/hdts/${id}/models`);
      const data: ModelDocument[] = await res.json();
      setModels(data);

      // Keep current selection if still valid, otherwise default to All
      setSelectedModelName((prev) =>
        prev === "All" || data.some((m) => m.modelName === prev) ? prev : "All"
      );
    } catch (err) {
      console.error("Failed to fetch models:", err);
    }
  }

  useEffect(() => {
    fetchState();
    fetchModels();

    const interval = setInterval(() => {
      fetchState();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [id]);

  const filteredProperties = useMemo(() => {
    return state.filter((p: PropertyEventDocument) => {
      const matchesModel =
        selectedModelName === "All" || p.metaField.modelName === selectedModelName;

      if (!matchesModel) return false;

      const q = search.trim();
      if (!q) return true;

      try {
        const regex = new RegExp(q, "i");
        return regex.test(p.metaField.propertyName);
      } catch {
        return true;
      }
    });
  }, [state, selectedModelName, search])

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
              {models.map((m) => (
                <Tab key={m.modelId} value={m.modelName} label={m.modelName} />
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
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((prop: PropertyEventDocument) => {
                  const modelId = prop.metaField.modelId;
                  const propertyId = prop.metaField.propertyId;
                  const propertyName = prop.metaField.propertyName;
                  const timestamp = new Date(prop.timeField);

                  return (
                    <tr
                      key={propertyId}
                      className="bg-gray-900 hover:bg-gray-800"
                      onClick={() => router.push(`/hdt/${id}/property-live`)}
                    >
                      <td className="p-2 border border-gray-700">{modelId}</td>
                      <td className="p-2 border border-gray-700">{propertyName}</td>
                      <td className="p-2 border border-gray-700">{prop.value.value?.toString()}</td>
                      <td className="p-2 border border-gray-700">{timestamp.toDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
