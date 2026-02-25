"use client";

import { useEffect, useState } from "react";
import { AggregateOperation } from "@/types/query";
import { FilterOperator } from "@/types/query";

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
  const [availableDts, setAvailableDts] = useState<string[]>([]);
  const [loadingDts, setLoadingDts] = useState(true);

  const [filters, setFilters] = useState<FilterType[]>([]);
  const [results, setResults] = useState<Record<string, any>[]>([]);

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
          filters: normalizedFilters,
          dts,
        }
      : {
          type: "search",
          property,
          filters: normalizedFilters,
        };

  const handleSubmit = () => {
    console.log(
      queryMode === "aggregate"
        ? "Aggregate query:"
        : "Search query:",
      query
    );

    const fakeResults = [
      { name: "Anna", age: 24, heartRate: 72 },
      { name: "Giovanni", age: 30, heartRate: 80 },
      { name: "Jack", age: 27, heartRate: 75 },
    ];

    setResults(fakeResults);
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
            </div>

            {queryMode === "aggregate" && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <label className="block mb-2 font-semibold">
                  Digital Twins
                </label>

                {loadingDts ? (
                  <p>Loading...</p>
                ) : (
                  availableDts.map((dt) => (
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

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-500 transition px-6 py-3 rounded-lg font-semibold"
            >
              Generate JSON
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