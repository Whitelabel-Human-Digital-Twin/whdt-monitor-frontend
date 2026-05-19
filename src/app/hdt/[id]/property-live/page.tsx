// app/hdt/[id]/property-live/page.tsx
"use client";

import { use, useEffect, useMemo, useState } from "react";
import LiveLineChart from "@/components/LiveLineChart";
import { Filter } from "@/components/Filter";
import { HdtSpecResponse, PropertyObservationDocument, PropertySpecEntry } from "@/lib/api/schema";
import { api } from "@/lib/api/client";

const NUMERIC_TYPES = ["INT", "LONG", "FLOAT", "DOUBLE"];

interface PropertyListItemProps {
  propertyName: string;
  selected: boolean;
  onClick: () => void;
}

function PropertyListItem({ propertyName, selected, onClick }: PropertyListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-2 border-b ${
        selected ? "bg-blue-700 text-white" : "bg-gray-800 text-gray-300"
      } hover:bg-blue-600`}
    >
      {propertyName}
    </div>
  );
}

export default function PropertyLiveUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [spec, setSpec] = useState<HdtSpecResponse | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [propertyHistory, setPropertyHistory] = useState<PropertyObservationDocument[]>([]);

  const fetchSpec = async () => {
    try {
      const res = await api.GET("/hdts/{id}/spec", {
        params: {
          path: { id }
        }
      });
      setSpec(res.data ?? null);
    } catch (err) {
      console.error("Failed to fetch HDT spec:", err);
      setSpec(null);
    }
  };

  const fetchPropertyHistory = async (dtId: string, pName: string) => {
    try {
      const res = await api.POST("/query/event/values/history", {
        body: [{
          hdtId: dtId,
          propertyName: pName,
        }]
      });
      setPropertyHistory(res.data ?? []);
    } catch (err) {
      console.error("Failed to fetch property history:", err);
    }
  };

  const numericProperties: PropertySpecEntry[] = useMemo(() =>
    spec?.models.flatMap((m) =>
      m.properties.filter((p) => NUMERIC_TYPES.includes(p.declaredType))
    ) ?? [],
    [spec]
  );

  const filteredProperties = useMemo(() => {
    const q = search.trim();
    if (!q) return numericProperties;
    try {
      const regex = new RegExp(q, "i");
      return numericProperties.filter((p) => regex.test(p.propertyName));
    } catch {
      return numericProperties;
    }
  }, [numericProperties, search]);

  useEffect(() => {
    fetchSpec();

    if (!selectedProperty) {
      setSelectedProperty(filteredProperties[0]?.propertyName ?? null);
    }
  }, [id]);

  return (
    <div className="flex w-full h-full p-4 gap-4">
      {/* Left - Property list */}
      <div className="w-1/4 bg-gray-900 rounded p-2 overflow-auto max-h-screen">
        <h2 className="font-bold text-white mb-2">Properties</h2>

        <Filter
          value={search}
          onChange={setSearch}
          placeholder="Search properties..."
          className="mb-2 p-2 border border-gray-700 rounded bg-gray-800 text-white w-full"
        />

        {filteredProperties.map((p) => (
          <PropertyListItem
            key={p.propertyId}
            propertyName={p.propertyName}
            selected={p.propertyName === selectedProperty}
            onClick={() => {
              fetchPropertyHistory(id, p.propertyName);
              setSelectedProperty(p.propertyName);
            }}
          />
        ))}
      </div>

      {/* Right - Chart view */}
      <div className="flex-1 bg-gray-800 rounded p-4">
        <h2 className="text-white text-lg font-semibold mb-4">
          Live Chart for <span className="text-blue-300">{selectedProperty}</span>
        </h2>

        {selectedProperty ? (
          <LiveLineChart
            dtId={id}
            pName={selectedProperty}
            history={propertyHistory}
          />
        ) : (
          <p className="text-white">Select a property to view its live chart.</p>
        )}
      </div>
    </div>
  );
}
