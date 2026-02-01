"use client";

import { useState } from "react";
import { AggregateQuery, AggregateOperation } from "@/types/query";

export default function QueryBuilderPage() {
  const [operation, setOperation] = useState<AggregateOperation>("avg");
  const [property, setProperty] = useState("");
  const [dts, setDts] = useState<string[]>([]);

  const query: AggregateQuery = {
    operation,
    property,
    filters: [],
    dts,
  };

  const handleSubmit = () => {
    console.log("Generated query:", query);
  };

  const availableDts = ["dt-1", "dt-2", "dt-3"];

  return (
    <div className="p-4 text-white">
      <h1 className="text-xl font-bold mb-4">Query Builder</h1>
    
    <div className="mb-4">
      <label className="block mb-1">Operation</label>

      {(["avg", "min", "max"] as AggregateOperation[]).map(op => (
        <button
          key={op}
          onClick={() => setOperation(op)}
          className={`mr-2 px-3 py-1 rounded ${
            operation === op ? "bg-blue-700" : "bg-gray-700"
          }`}
      >
          {op}
        </button>
      ))}
    </div>

    <div className="mb-4">
      <label className="block mb-1">Property</label>

      <input
        className="p-2 bg-gray-800 border border-gray-600 rounded w-full"
        value={property}
        onChange={(e) => setProperty(e.target.value)}
        placeholder="e.g. heart-rate"
      />
    </div>

    <div className="mb-4">
      <label className="block mb-1">Digital Twins</label>

      {availableDts.map((dt) => (
        <label key={dt} className="block">
          <input
            type="checkbox"
            checked={dts.includes(dt)}
            onChange={(e) => {
              if (e.target.checked) {
                setDts([...dts, dt]);
              } else {
                setDts(dts.filter((id) => id !== dt));
              }
            }}
            className="mr-2"
          />
        {dt}
        </label>
      ))}
    </div>

      <button onClick={handleSubmit} className="bg-blue-600 px-4 py-2 rounded">
        Generate JSON
      </button>
    </div>
  );
}
