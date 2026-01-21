// app/hdt/[id]/property-live/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import LiveLineChart from "@/components/LiveLineChart";
import { PropertyResponse } from "@/types/hdt";
import { Filter } from "@/components/Filter";

interface PropertyListItemProps {
  propertyType: string;
  selected: boolean;
  onClick: () => void;
}

function PropertyListItem({ propertyType, selected, onClick }: PropertyListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-2 border-b ${
        selected ? "bg-blue-700 text-white" : "bg-gray-800 text-gray-300"
      } hover:bg-blue-600`}
    >
      {propertyType}
    </div>
  );
}

export default function PropertyLiveUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dtProperties, setDtProperties] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [search, setSearch] = useState("");


  const fetchProperties = async () => {
    try {
      let res = await fetch(`/api/hdt/${id}/state/properties`)
      let data: Array<PropertyResponse> = await res.json()
      let names = data.map(p => p.value).map(p => p.id)
      console.log("Fetched properties: ", names)
      setDtProperties(names)
    } catch (err) {
      console.error("Failed to fetch DT properties:", err);
      setDtProperties([])
    }
  }

  const filteredProperties = dtProperties.filter((prop) => {
    const q = search.trim();
    if (!q) return true;

    try {
      const regex = new RegExp(q, "i");
    return regex.test(prop);
    } catch {
    return true;
    }
  });


  // Select first one as default
  useEffect(() => {
    fetchProperties()

    if (!selectedProperty) {
      setSelectedProperty(dtProperties[0]);
    }

    const interval = setInterval(() => {
      fetchProperties();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
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

      {filteredProperties.map((type) => (

          <PropertyListItem
            key={type}
            propertyType={type}
            selected={type === selectedProperty}
            onClick={() => setSelectedProperty(type)}
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
            propertyType={selectedProperty}
          />
        ) : (
          <p className="text-white">Select a property to view its live chart.</p>
        )}
      </div>
    </div>
  );
}
