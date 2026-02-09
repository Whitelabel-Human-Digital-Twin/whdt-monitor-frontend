"use client";

import { useEffect, useState } from "react";
import { AggregateQuery, AggregateOperation } from "@/types/query";
import { FilterOperator } from "@/types/query";

export default function QueryBuilderPage() {
  const [operation, setOperation] = useState<AggregateOperation>("avg");
  const [property, setProperty] = useState("");
  const [dts, setDts] = useState<string[]>([]);
  const [availableDts, setAvailableDts] = useState<string[]>([]);
  const [loadingDts, setLoadingDts] = useState(true);
  const [filterField, setFilterField] = useState("");
  const [filterOperator, setFilterOperator] =
    useState<FilterOperator>(">");

  const [filterValue, setFilterValue] = useState("");

  const filters = filterField
    ? [
        {
          propertyName: filterField,
          op: filterOperator,
          value: Number(filterValue),
        },
      ]
    : [];


  const query: AggregateQuery = {
    operation,
    property,
    filters,
    dts,
  };

  const handleSubmit = () => {
    console.log("Generated query:", query);
  };

  useEffect(() => {
    const fetchDts = async () => {
      try {
        setLoadingDts(true);
        const res = await fetch("/api/hdt");
        const data = await res.json();
        setAvailableDts(data); 
      } catch (err) {
        console.error("Failed to fetch DT list:", err);
        setAvailableDts([]);
      } finally {
        setLoadingDts(false);
      }
    };

    fetchDts();
  }, []);

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
      <label className="block mb-1 font-semibold">Digital Twins</label>

      {loadingDts ? (
        <p className="text-gray-300">Loading DTs...</p>
      ) : (
        <div className="space-y-2">
          {availableDts.map((dt) => (
            <label key={dt} className="block">
              <input
                type="checkbox"
                checked={dts.includes(dt)}
                onChange={(e) =>
                  setDts(
                    e.target.checked
                      ? [...dts, dt]
                      : dts.filter((x) => x !== dt)
                  )
                }
              />
              <span className="ml-2">{dt}</span>
            </label>
          ))}
        </div>
      )}
    </div>

      <input
        placeholder="property"
        value={filterField}
        onChange={(e) => setFilterField(e.target.value)}
      />

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Operator</label>

        <div className="flex gap-2">
          {["<", ">", "<=", ">=", "="].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setFilterOperator(op as FilterOperator)}
              className={`px-3 py-1 rounded border ${
                filterOperator === op
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      <input
        placeholder="value"
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
      />


      <button onClick={handleSubmit} className="bg-blue-600 px-4 py-2 rounded">
        Generate JSON
      </button>
    </div>
  );
}
