"use client";

import { useEffect, useMemo, useState } from "react";
import { HdtsByModelRequestDto, HdtModelAvailability, ModelDocument } from "@/lib/api/schema";
import { api } from "@/lib/api/client";
import { distinct } from "@/util/utils";
import { LoadingOverlay } from "@/components/common/LoadingOverlay";
import { AvailabilityMatrix } from "@/components/query/availability/AvailabilityMatrix";

type ModelOption = { modelName: string; isSensor: boolean };
type Match = "ANY" | "ALL";

function toIso(local: string): string {
  return new Date(local).toISOString();
}

function deriveModelOptions(docs: ModelDocument[]): ModelOption[] {
  const isSensorByName = new Map<string, boolean>();
  for (const doc of docs) {
    const isSensor = doc.tags?.origin === "sensorCsv";
    isSensorByName.set(doc.modelName, isSensorByName.get(doc.modelName) || isSensor);
  }
  return [...isSensorByName.entries()]
    .map(([modelName, isSensor]) => ({ modelName, isSensor }))
    .sort((a, b) => a.modelName.localeCompare(b.modelName));
}

export function RawDataAvailabilityPanel() {
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [match, setMatch] = useState<Match>("ANY");
  const [task, setTask] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState<HdtModelAvailability[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.GET("/models").then((res) => {
      if (res.data) {
        setModelOptions(deriveModelOptions(res.data));
      }
    });
  }, []);

  const sensorModels = modelOptions.filter((m) => m.isSensor);
  const otherModels = modelOptions.filter((m) => !m.isSensor);
  const matchDisabled = selectedModels.length === 0;

  const toggleModel = (name: string) => {
    setSelectedModels((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setResults(null);
    setLoading(true);

    try {
      const metadataFilters: Record<string, string[]> = {};
      if (task.trim() !== "") metadataFilters.task = [task.trim()];

      const body: HdtsByModelRequestDto = {
        ...(selectedModels.length > 0 ? { modelNames: selectedModels, match } : {}),
        ...(Object.keys(metadataFilters).length > 0 ? { metadataFilters } : {}),
        ...(from ? { from: toIso(from) } : {}),
        ...(to ? { to: toIso(to) } : {}),
      };

      const { data, error: err } = await api.POST("/query/hdts/by-model", { body });

      if (err) {
        setError("Request failed");
        return;
      }

      setResults(data ?? []);
    } catch {
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const columnModelNames = useMemo(() => {
    if (selectedModels.length > 0) return selectedModels;
    if (!results) return [];
    return distinct(results.flatMap((r) => r.models.map((m) => m.modelName))).sort();
  }, [selectedModels, results]);

  return (
    <div className="flex gap-8 items-start">
      <div className="w-1/2">
        {/* Model selector */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <label className="block mb-2 font-semibold">Models</label>
          {modelOptions.length === 0 ? (
            <p className="text-gray-400 text-sm">No models found.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Sensors</p>
                {sensorModels.length === 0 ? (
                  <p className="text-gray-500 text-xs">None</p>
                ) : (
                  sensorModels.map((m) => (
                    <label key={m.modelName} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(m.modelName)}
                        onChange={() => toggleModel(m.modelName)}
                      />
                      <span>{m.modelName}</span>
                    </label>
                  ))
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Other models</p>
                {otherModels.length === 0 ? (
                  <p className="text-gray-500 text-xs">None</p>
                ) : (
                  otherModels.map((m) => (
                    <label key={m.modelName} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(m.modelName)}
                        onChange={() => toggleModel(m.modelName)}
                      />
                      <span>{m.modelName}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ANY/ALL toggle */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <label className="block mb-2 font-semibold">Match</label>
          <div className={`flex gap-4 ${matchDisabled ? "opacity-40" : ""}`}>
            {(["ANY", "ALL"] as Match[]).map((m) => (
              <button
                key={m}
                disabled={matchDisabled}
                onClick={() => setMatch(m)}
                className={`px-4 py-2 rounded disabled:cursor-not-allowed ${
                  match === m && !matchDisabled ? "bg-blue-600" : "bg-gray-600 hover:bg-gray-500"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {matchDisabled && (
            <p className="text-xs text-gray-400 mt-2">
              Select one or more models to enable ANY/ALL matching.
            </p>
          )}
        </div>

        {/* Task filter */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <label className="block mb-2 font-semibold">Task (optional)</label>
          <input
            type="text"
            className="p-2 bg-gray-800 border border-gray-600 rounded w-full"
            placeholder="e.g. walking"
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
        </div>

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

        {results && results.length === 0 && !error && (
          <div className="p-4 bg-gray-700 rounded-lg mb-4 text-gray-400 text-center">
            No Digital Twins have data matching these criteria.
          </div>
        )}

        {results && results.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Availability</h2>
            <AvailabilityMatrix data={results} modelNames={columnModelNames} />
          </div>
        )}

        {!results && !error && (
          <div className="p-4 text-gray-400 text-center">
            Configure filters and run the query to see Digital Twin data availability.
          </div>
        )}
      </div>
    </div>
  );
}
