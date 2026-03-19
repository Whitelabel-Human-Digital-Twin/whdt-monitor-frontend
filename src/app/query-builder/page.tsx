"use client";

import { useEffect, useState } from "react";
import { AggregateOperation, toWhdtComparisonOp } from "@/types/query";
import { FilterOperator } from "@/types/query";
import { HumanDigitalTwinDocument } from "@/types/hdt/human_digital_twin";
import { ModelDocument } from "@/types/model/model";

type QueryMode = "aggregate" | "search";

type FilterType = {
  propertyName: string;
  op: FilterOperator;
  value: string;
};

export default function QueryBuilderPage() {
  const [queryMode, setQueryMode] = useState<QueryMode>("aggregate");

  const [operation, setOperation] = useState<AggregateOperation>("avg");
  const [property, setProperty] = useState("");
  const [dts, setDts] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([])
  const [hdtIds, setHdtIds] = useState<string[]>([])
  const [modelNames, setModelNames] = useState<string[]>([])
  const [loadingDts, setLoadingDts] = useState(true);
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [results, setResults] = useState<Record<string, any>[]>([]);

  function distinct<T>(arr: T[]): T[] {
    return [...new Set(arr)]
  }

  const addFilter = () => {
    setFilters([...filters, { propertyName: "", op: ">", value: "" }]);
  };

  const updateFilter = (
    index: number,
    field: keyof FilterType,
    value: string
  ) => {
    const newFilters = [...filters];
    newFilters[index] = {
      ...newFilters[index],
      [field]: value,
    };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const normalizedFilters = filters
    .filter(
      (f) => f.propertyName.trim() !== "" && f.value.trim() !== ""
    )
    .map((f) => ({
      propertyName: f.propertyName,
      op: f.op,
      value: Number(f.value),
    }));

  const query =
    queryMode === "aggregate"
      ? {
          type: "aggregate",
          operation,
          property,
          dts,
          models,
        }
      : {
          type: "search",
          property,
          models,
          filters: normalizedFilters,
        };

  const handleSubmit = async () => {
    try {
      if (queryMode === "aggregate") {
        const body = {
          "hdtIds": query.dts,
          "modelIds": [],
          "modelNames": query.models,
          "propertyName": query.property
        }
        const res = await fetch("/api/persistence/hdts/events/aggregate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(body)
        })
        const data = await res.json()
        setResults(data)
      } else if (queryMode === "search") {
        const comparisons = query.filters?.map(f => {
          return {
            "propertyName": f.propertyName,
            "comparison": toWhdtComparisonOp(f.op),
            "value": {
              "type": "double-value",
              "value": f.value
            }
        }})
        const body = {
          "comparisons": comparisons,
          "modelNames": query.models,
        }
        const res = await fetch("/api/persistence/hdts/aggregate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(body)
        })
        const data: HumanDigitalTwinDocument[] = await res.json()
        const r = data.map(m => ({hdtId:m}))
        setResults(r)
      }
    } catch(err) {
      console.log("Failed to execute aggregate query: ", err)
    }
    
    

    //setResults(fakeResults);
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = Object.keys(results[0]).join(",");
    const rows = results
      .map((row) => Object.values(row).join(","))
      .join("\n");

    const csvContent = headers + "\n" + rows;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "query-results.csv";
    link.click();
  };

  const fetchDts = async () => {
    try {
      setLoadingDts(true);
      const res = await fetch("/api/persistence/hdts");
      const data: HumanDigitalTwinDocument[] = await res.json();
      setHdtIds(data.map((hdt) => hdt.hdtId))
    } catch (err) {
      console.error("Failed to fetch DT list:", err);
    } finally {
      setLoadingDts(false);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/persistence/hdts/models");
      const data: ModelDocument[] = await res.json();
      const names = data.map((m) => m.modelName)
      setModelNames(distinct(names))
    } catch (err) {
      console.error("Failed to fetch Model list:", err);
      setModelNames([]);
    }
  }

  useEffect(() => {
    fetchDts()
    fetchModels()
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center p-6">
      <div className="w-full max-w-6xl bg-gray-800 p-8 rounded-xl shadow-xl text-white">
        <h1 className="text-2xl font-bold mb-6">
          Query Builder
        </h1>

        <div className="flex gap-8 items-start">
          <div className="w-1/2">
            <div className="mb-6 flex gap-4">
              <button
                onClick={() => setQueryMode("aggregate")}
                className={`px-4 py-2 rounded ${
                  queryMode === "aggregate"
                    ? "bg-blue-600"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                Aggregate
              </button>

              <button
                onClick={() => setQueryMode("search")}
                className={`px-4 py-2 rounded ${
                  queryMode === "search"
                    ? "bg-blue-600"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                Search DTs
              </button>
            </div>

            {queryMode === "aggregate" && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <label className="block mb-2 font-semibold">
                  Operation
                </label>
                {(["avg", "min", "max"] as AggregateOperation[]).map(
                  (op) => (
                    <button
                      key={op}
                      onClick={() => setOperation(op)}
                      className={`mr-2 px-4 py-2 rounded ${
                        operation === op
                          ? "bg-blue-600"
                          : "bg-gray-600 hover:bg-gray-500"
                      }`}
                    >
                      {op}
                    </button>
                  )
                )}
              </div>
            )}

            {queryMode === "aggregate" && 
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <label className="block mb-2 font-semibold">
                Property
              </label>
              <input
                className="p-2 bg-gray-800 border border-gray-600 rounded w-full"
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                placeholder="e.g. heart-rate"
              />
            </div>}

            {/** HUMAN DIGITAL TWINS */}
            {queryMode === "aggregate" && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <label className="block mb-2 font-semibold">
                  Digital Twins
                </label>

                {loadingDts ? (
                  <p>Loading...</p>
                ) : (
                  hdtIds.map((dt) => (
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
                  ))
                )}
              </div>
            )}

            {/** MODELS */}
            <div className="mb-6 p-4 bg-gray-700 rounded-lg">
              <label className="block mb-2 font-semibold">
                  Models
              </label>
              {modelNames.map(n => 
                (
                  <label key={n} className="block">
                      <input
                        type="checkbox"
                        checked={models.includes(n)}
                        onChange={(e) =>
                          setModels(
                            e.target.checked
                              ? [...models, n]
                              : models.filter((x) => x !== n)
                          )
                        }
                      />
                      <span className="ml-2">{n}</span>
                    </label>
                )
              )}
            </div>

            {queryMode === "search" && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <label className="font-semibold">
                    Filters
                  </label>
                  <button
                    onClick={addFilter}
                    className="bg-green-600 px-3 py-1 rounded text-sm"
                  >
                    + Add Filter
                  </button>
                </div>

                {filters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-center mb-3"
                  >
                    <input
                      type="text"
                      className="p-2 bg-gray-800 border border-gray-600 rounded w-32"
                      placeholder="property"
                      value={filter.propertyName}
                      onChange={(e) =>
                        updateFilter(
                          index,
                          "propertyName",
                          e.target.value
                        )
                      }
                    />

                    <select
                      className="p-2 bg-gray-800 border border-gray-600 rounded"
                      value={filter.op}
                      onChange={(e) =>
                        updateFilter(
                          index,
                          "op",
                          e.target.value
                        )
                      }
                    >
                      <option value="<">&lt;</option>
                      <option value=">">&gt;</option>
                      <option value="<=">&lt;=</option>
                      <option value=">=">&gt;=</option>
                      <option value="=">=</option>
                    </select>

                    <input
                      type="text"
                      inputMode="numeric"
                      className="p-2 bg-gray-800 border border-gray-600 rounded w-24"
                      placeholder="value"
                      value={filter.value}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^\d*$/.test(v)) {
                          updateFilter(
                            index,
                            "value",
                            v
                          );
                        }
                      }}
                    />

                    <button
                      onClick={() =>
                        removeFilter(index)
                      }
                      className="bg-red-600 px-2 py-1 rounded text-sm"
                    >
                      X
                    </button>
                  </div>
                ))}
            </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-500 transition px-6 py-3 rounded-lg font-semibold"
            >
              Generate Query
            </button>
          </div>

          <div className="w-1/2">
            {results.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4">
                  Query Results
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm rounded-lg overflow-hidden shadow-md">
                    <thead className="bg-gray-700">
                      <tr>
                        {Object.keys(results[0]).map(
                          (key) => (
                            <th
                              key={key}
                              className="px-4 py-2 text-left"
                            >
                              {key}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {results.map(
                        (row, index) => (
                          <tr
                            key={index}
                            className="border-t border-gray-700 hover:bg-gray-700"
                          >
                            {Object.values(
                              row
                            ).map((value, i) => (
                              <td
                                key={i}
                                className="px-4 py-2"
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={exportToCSV}
                  className="mt-4 bg-green-600 hover:bg-green-500 transition px-6 py-2 rounded-lg font-semibold"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}