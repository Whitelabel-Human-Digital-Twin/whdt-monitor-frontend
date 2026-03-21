// app/hdt/[id]/property-live/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import LiveLineChart from "@/components/LiveLineChart";
import { Filter } from "@/components/Filter";
import { PropertyEventDocument } from "@/types/event/property_event";
import { distinct } from "@/util/utils";

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
  const [dtProperties, setDtProperties] = useState<PropertyEventDocument[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [propertyHistory, setPropertyHistory] = useState<PropertyEventDocument[]>([])


  const fetchProperties = async () => {
    try {
      const res = await fetch(`/api/persistence/hdts/${id}/events`)
      const data: PropertyEventDocument[] = await res.json()
      setDtProperties(data)
    } catch (err) {
      console.error("Failed to fetch DT properties:", err);
      setDtProperties([])
    }
  }

  const fetchPropertyHistory = async (dtId: string, pName: string) => {
    try {
      const request = {
        hdtId: dtId,
        propertyName: pName,
      }
      const body = JSON.stringify(request)
      const res = await fetch(`/api/persistence/hdts/events/propertyHistory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: body
      });
      const data: PropertyEventDocument[] = await res.json();
      setPropertyHistory(data)
    } catch (err) {
      console.error("Failed to fetch property history:", err);
    }
  };

  const filteredProperties = 
      dtProperties
        .filter((prop) => {
          const q = search.trim();
          if (!q) return true;
          try {
            const regex = new RegExp(q, "i");
            return regex.test(prop.metaField.propertyId);
          } catch {
            return true;
          }
      })
      .filter((p) => {
        return typeof p.value.value === "number"
      })
    

  const propertyNames = distinct(filteredProperties.map((p) => p.metaField.propertyName))

  // Select first one as default
  useEffect(() => {
    fetchProperties()

    if (!selectedProperty) {
      setSelectedProperty(propertyNames[0]);
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

      {filteredProperties.map((e) => (

          <PropertyListItem
            key={e.metaField.propertyId}
            propertyName={e.metaField.propertyName}
            selected={e.metaField.propertyId === selectedProperty}
            onClick={() => {
              fetchPropertyHistory(e.metaField.hdtId, e.metaField.propertyName)
              setSelectedProperty(e.metaField.propertyName)
            }}
          />
        ))}
      </div>

      {/* Right - Chart view */}
      <div className="flex-1 bg-gray-800 rounded p-4">
        <h2 className="text-white text-lg font-semibold mb-4">
          Live Chart for <span className="text-blue-300">{selectedProperty}</span>
        </h2>

        {selectedProperty ? 
          (
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
