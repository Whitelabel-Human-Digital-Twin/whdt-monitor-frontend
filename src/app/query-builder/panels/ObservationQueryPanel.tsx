"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  CohortResult,
  PropertiesByComparisonsRequestDto,
  PropertyComparisonDto,
  PropertyStatsRequest,
} from "@/lib/api/schema";
import { api } from "@/lib/api/client";
import { distinct } from "@/util/utils";
import { FilterOperator, toWhdtComparisonOp } from "@/app/query-builder/types/query";
import { HdtScopeSelector } from "@/components/query/HdtScopeSelector";
import { SearchablePropertySelect } from "@/components/common/SearchablePropertySelect";
import { LoadingOverlay } from "@/components/common/LoadingOverlay";
import { CohortTable } from "@/components/query/cohort/CohortTable";
import { PopulationStatsMatrix } from "@/components/query/cohort/PopulationStatsMatrix";
import { deriveCohortColumns } from "@/components/query/cohort/shared";
import { exportCohortToExcel } from "@/components/query/cohort/exportToExcel";
import { ScrollableTable } from "@/components/common/ScrollableTable";
import { STICKY_HEADER_CELL } from "@/components/common/tableSticky";

type ObservationMode = "aggregate" | "search";
type ValueType = "number" | "string" | "boolean";

type ComparisonFilter = {
  propertyName: string;
  op: FilterOperator;
  valueType: ValueType;
  value: string;
};

function parseValue(raw: string, valueType: ValueType): number | string | boolean {
  if (valueType === "number") return Number(raw);
  if (valueType === "boolean") return raw === "true";
  return raw;
}

function toIso(local: string): string {
  return new Date(local).toISOString();
}

export function ObservationQueryPanel() {
  const [mode, setMode] = useState<ObservationMode>("aggregate");
  const [property, setProperty] = useState("");
  const [selectedHdtIds, setSelectedHdtIds] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [modelNames, setModelNames] = useState<string[]>([]);
  const [propertyNames, setPropertyNames] = useState<string[]>([]);
  const [filters, setFilters] = useState<ComparisonFilter[]>([]);
  const [task, setTask] = useState("");
  const [sex, setSex] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [cohortResult, setCohortResult] = useState<CohortResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPerDtBreakdown, setShowPerDtBreakdown] = useState(false);

  useEffect(() => {
    api.GET("/models").then((res) => {
      if (res.data) {
        setModelNames(distinct(res.data.map((m) => m.modelName)));
      }
    });
    api.GET("/properties/names").then((res) => {
      if (res.data) {
        setPropertyNames(distinct(res.data));
      }
    });
  }, []);

  const addFilter = () => {
    setFilters([
      ...filters,
      { propertyName: "", op: ">", valueType: "number", value: "" },
    ]);
  };

  const updateFilter = (
    index: number,
    field: keyof ComparisonFilter,
    value: string
  ) => {
    setFilters(filters.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);
    setEmpty(false);
    setResults([]);
    setCohortResult(null);
    setShowPerDtBreakdown(false);
    setLoading(true);

    try {
      if (mode === "aggregate") {
        const body: PropertyStatsRequest = {
          hdtIds: selectedHdtIds,
          modelIds: [],
          modelNames: models,
          propertyName: property,
          ...(from ? { from: toIso(from) } : {}),
          ...(to ? { to: toIso(to) } : {}),
        };

        const { data, error: err } = await api.POST("/query/event/stats", { body });

        if (err) {
          setError("Request failed");
          return;
        }

        if (!data || data.length === 0) {
          setEmpty(true);
          return;
        }

        setResults(data as unknown as Record<string, unknown>[]);
      } else {
        const comparisons: PropertyComparisonDto[] = filters
          .filter((f) => f.propertyName.trim() !== "" && f.value.trim() !== "")
          .map((f) => ({
            propertyName: f.propertyName,
            comparison: toWhdtComparisonOp(f.op),
            value: parseValue(f.value, f.valueType),
          }));

        const metadataFilters: Record<string, string[]> = {};
        if (task.trim() !== "") metadataFilters.task = [task.trim()];
        if (sex.trim() !== "") metadataFilters.sex = [sex.trim()];

        const body: PropertiesByComparisonsRequestDto = {
          comparisons,
          modelNames: models,
          ...(from ? { from: toIso(from) } : {}),
          ...(to ? { to: toIso(to) } : {}),
          ...(Object.keys(metadataFilters).length > 0 ? { metadataFilters } : {}),
        };

        const { data, error: err } = await api.POST("/query/cohort", { body });

        if (err) {
          setError("Request failed");
          return;
        }

        if (!data || data.rows.length === 0) {
          setEmpty(true);
          return;
        }

        setCohortResult(data);
      }
    } catch {
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    const headers = Object.keys(results[0]).join(",");
    const rows = results.map((row) => Object.values(row).join(",")).join("\n");
    downloadCSV(headers + "\n" + rows, "query-results.csv");
  };

  const filteredPropertyNames = filters
    .filter((f) => f.propertyName.trim() !== "")
    .map((f) => f.propertyName);

  const exportCohortToExcelFile = () => {
    if (!cohortResult) return;
    const columns = deriveCohortColumns(cohortResult.populationStats, filteredPropertyNames);
    exportCohortToExcel(cohortResult, columns, "cohort.xlsx");
  };

  return (
    <div className="flex gap-8 items-start">
      <div className="w-1/2">
        {/* Mode toggle */}
        <div className="mb-6 flex gap-4">
          {(["aggregate", "search"] as ObservationMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded ${
                mode === m ? "bg-blue-600" : "bg-gray-600 hover:bg-gray-500"
              }`}
            >
              {m === "aggregate" ? "Aggregate" : "Search DTs"}
            </button>
          ))}
        </div>

        {/* Property name */}
        {mode === "aggregate" && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <label className="block mb-2 font-semibold">Property</label>
            <SearchablePropertySelect
              propertyNames={propertyNames}
              value={property}
              onChange={setProperty}
              label="Property"
            />
          </div>
        )}

        {/* HDT scope (aggregate only) */}
        {mode === "aggregate" && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <label className="block mb-2 font-semibold">Digital Twins</label>
            <HdtScopeSelector selected={selectedHdtIds} onChange={setSelectedHdtIds} />
          </div>
        )}

        {/* Model filter */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <label className="block mb-2 font-semibold">Models</label>
          {modelNames.length === 0 ? (
            <p className="text-gray-400 text-sm">No models found.</p>
          ) : (
            modelNames.map((n) => (
              <label key={n} className="flex items-center gap-2 cursor-pointer">
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
                <span>{n}</span>
              </label>
            ))
          )}
        </div>

        {/* Comparison filters (search mode) */}
        {mode === "search" && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <label className="font-semibold">Filters</label>
              <button
                onClick={addFilter}
                className="bg-green-600 px-3 py-1 rounded text-sm"
              >
                + Add Filter
              </button>
            </div>

            {filters.map((filter, index) => (
              <div key={index} className="flex gap-2 items-center mb-3 flex-wrap">
                <SearchablePropertySelect
                  propertyNames={propertyNames}
                  value={filter.propertyName}
                  onChange={(v) => updateFilter(index, "propertyName", v)}
                  placeholder="property"
                />

                <select
                  className="p-2 bg-gray-800 border border-gray-600 rounded"
                  value={filter.op}
                  onChange={(e) => updateFilter(index, "op", e.target.value)}
                >
                  <option value="<">&lt;</option>
                  <option value=">">&gt;</option>
                  <option value="<=">&lt;=</option>
                  <option value=">=">&gt;=</option>
                  <option value="=">=</option>
                </select>

                <select
                  className="p-2 bg-gray-800 border border-gray-600 rounded"
                  value={filter.valueType}
                  onChange={(e) => updateFilter(index, "valueType", e.target.value)}
                >
                  <option value="number">number</option>
                  <option value="string">string</option>
                  <option value="boolean">boolean</option>
                </select>

                {filter.valueType === "boolean" ? (
                  <select
                    className="p-2 bg-gray-800 border border-gray-600 rounded w-24"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, "value", e.target.value)}
                  >
                    <option value="">select</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    type={filter.valueType === "number" ? "number" : "text"}
                    className="p-2 bg-gray-800 border border-gray-600 rounded w-24"
                    placeholder="value"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, "value", e.target.value)}
                  />
                )}

                <button
                  onClick={() => removeFilter(index)}
                  className="bg-red-600 px-2 py-1 rounded text-sm"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Cohort metadata filters (search mode) */}
        {mode === "search" && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <label className="block mb-2 font-semibold">Cohort Filters</label>
            <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">Task</span>
                <input
                  type="text"
                  className="p-2 bg-gray-800 border border-gray-600 rounded"
                  placeholder="e.g. walking"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">Sex</span>
                <input
                  type="text"
                  className="p-2 bg-gray-800 border border-gray-600 rounded"
                  placeholder="e.g. female"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Time window */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <label className="block mb-2 font-semibold">Time Window (optional)</label>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">From</span>
              <input
                type="datetime-local"
                className="p-2 bg-gray-800 border border-gray-600 rounded"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">To</span>
              <input
                type="datetime-local"
                className="p-2 bg-gray-800 border border-gray-600 rounded"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition px-6 py-3 rounded-lg font-semibold"
        >
          {loading ? "Running…" : "Run Query"}
        </button>
      </div>

      {/* Results pane */}
      <div className="w-1/2 relative">
        <LoadingOverlay open={loading} message="Running query…" mode="inline" />

        {error && (
          <div className="p-4 bg-red-900 border border-red-600 rounded-lg mb-4 text-red-200">
            {error}
          </div>
        )}

        {empty && !error && (
          <div className="p-4 bg-gray-700 rounded-lg mb-4 text-gray-400 text-center">
            No results found.
          </div>
        )}

        {mode === "aggregate" && results.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Query Results</h2>

            <ScrollableTable>
              <table className="w-full text-sm">
                <thead className="bg-gray-700">
                  <tr>
                    {Object.keys(results[0]).map((key) => (
                      <th key={key} className={`px-4 py-2 text-left ${STICKY_HEADER_CELL}`}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {results.map((row, index) => (
                    <tr
                      key={index}
                      className="border-t border-gray-700 hover:bg-gray-700"
                    >
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-4 py-2">
                          {value as ReactNode}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollableTable>

            <button
              onClick={exportToCSV}
              className="mt-4 bg-green-600 hover:bg-green-500 transition px-6 py-2 rounded-lg font-semibold"
            >
              Export CSV
            </button>
          </div>
        )}

        {mode === "search" && cohortResult && (
          <div>
            <h2 className="text-lg font-bold mb-4">Population Stats</h2>

            <PopulationStatsMatrix
              populationStats={cohortResult.populationStats}
              filteredPropertyNames={filteredPropertyNames}
            />

            <button
              onClick={exportCohortToExcelFile}
              className="mt-4 bg-green-600 hover:bg-green-500 transition px-6 py-2 rounded-lg font-semibold"
            >
              Export Excel
            </button>

            <div className="mt-8">
              <button
                onClick={() => setShowPerDtBreakdown((v) => !v)}
                className="bg-gray-600 hover:bg-gray-500 transition px-4 py-2 rounded text-sm font-semibold"
              >
                {showPerDtBreakdown ? "▾" : "▸"} Per-DT breakdown
              </button>

              {showPerDtBreakdown && (
                <div className="mt-4">
                  <CohortTable data={cohortResult} filteredPropertyNames={filteredPropertyNames} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
