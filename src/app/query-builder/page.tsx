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
  const [results, setResults] = useState<Record<string, any>[]>([]);

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

  const handleSubmit = async () => {
    console.log("Generated query:", query);
    const req = {propertyName: query.property, valueKey: query.filters[0].propertyName, operator:"GT", value: {type:"float-value", value:query.filters[0].value}}
    try {
      const response = await fetch("http://localhost:8081/api/hdts/findByPropertyComparison", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req)
        })

        if (!response.ok) {
          throw new Error("Request failed");
        }

        const result = await response.json();
        console.log(result);
        setResults(result)
    } catch (error) {
      console.error(error);
    } 
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
      <h1 className="text-2xl font-bold mb-8 border-b border-gray-600 pb-3">Query Builder</h1>
        <div className="flex gap-8 items-start">
          <div className="w-1/2">

    <div className="mb-6 p-4 bg-gray-700 rounded-lg">
      <label className="block mb-1">Property</label>

      <input
        className="p-2 bg-gray-800 border border-gray-600 rounded w-2/3"
        value={property}
        onChange={(e) => setProperty(e.target.value)}
        placeholder="e.g. heart-rate"
      />
    </div>

    <div className="mb-6 p-4 bg-gray-700 rounded-lg">
      <label className="block mb-2 font-semibold">Filter Property</label>
      <input
        className="p-2 bg-gray-800 border border-gray-600 rounded w-full"
        placeholder="e.g. age"
        value={filterField}
        onChange={(e) => setFilterField(e.target.value)}
      />
    </div>


      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
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

      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <label className="block mb-2 font-semibold">Filter Value</label>
        <input
          className="p-2 bg-gray-800 border border-gray-600 rounded w-32"
          placeholder="e.g. 25"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />
    </div>

      <button onClick={handleSubmit} className="mt-4 bg-blue-600 hover:bg-blue-500 transition px-6 py-2 rounded-lg font-semibold w-full">
        Run Query
      </button>
    </div>
    <div className="w-1/2">


      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Query Results</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm rounded-lg overflow-hidden shadow-md">
              <thead className="bg-gray-700 text-gray-200">
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-2 text-left font-semibold"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {results.map((row, index) => (
                  <tr key={index} className="border-t border-gray-700 hover:bg-gray-700 transition">
                    {Object.values(row).map((value, i) => (
                      <td
                        key={i}
                        className="px-4 py-2"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
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