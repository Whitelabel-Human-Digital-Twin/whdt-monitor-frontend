"use client";

import { useEffect, useState } from "react";
import HdtTaskView from "@/components/HdtTaskView";
import { api } from "@/lib/api/client";
import { HumanDigitalTwinDocument } from "@/lib/api/schema";
import { SearchableHdtSelect } from "@/components/common/SearchableHdtSelect";
import { LoadingOverlay } from "@/components/common/LoadingOverlay";

type ImportMode = "excel" | "json" | "sensorCsv";
type JsonStatus = { kind: "error" | "success"; message: string } | null;

type SensorUploadStatus =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type SensorCsvEntry = {
  id: string;
  file: File;
  patientId: string;
  task: string;
  sensor: string;
  status: SensorUploadStatus;
};

const MAX_IDS_SHOWN = 10;

// Creation service, backend TODO 8: per-sensor CSV multipart upload.
// Routed by next.config.ts: /api/creation/* → creation service /api/*.
const SENSOR_CSV_ENDPOINT = "/api/creation/hdts/sensor/multipart";

// Filename convention is <patientId>_<task>_<sensor>.csv, but it is not
// guaranteed — the parsed values are shown as editable fields before upload.
// The first two underscore-delimited tokens map to patientId and task; any
// remainder is treated as the sensor (sensor names may contain underscores).
function parseSensorFileName(name: string): {
  patientId: string;
  task: string;
  sensor: string;
} {
  const base = name.replace(/\.csv$/i, "");
  const parts = base.split("_");
  return {
    patientId: parts[0] ?? "",
    task: parts[1] ?? "",
    sensor: parts.slice(2).join("_"),
  };
}

function formatCreatedMessage(ids: string[]): string {
  const count = ids.length;
  if (count === 0) return "No HDTs created";
  const noun = count === 1 ? "HDT" : "HDTs";
  const shown = ids.slice(0, MAX_IDS_SHOWN).join(", ");
  const suffix = count > MAX_IDS_SHOWN ? `, …(+${count - MAX_IDS_SHOWN} more)` : "";
  return `Created ${count} ${noun}: ${shown}${suffix}`;
}

export default function HdtManager() {
  const [hdtList, setHdtList] = useState<HumanDigitalTwinDocument[]>([]);
  const [highlightedDT, setHighlightedDT] = useState<HumanDigitalTwinDocument | null>(null);
  const [excelInput, setExcelInput] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("excel");
  const [jsonText, setJsonText] = useState<string>("");
  const [jsonStatus, setJsonStatus] = useState<JsonStatus>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [sensorEntries, setSensorEntries] = useState<SensorCsvEntry[]>([]);
  const [sensorUploading, setSensorUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchHdts = async () => {
    try {
      const res  = await api.GET("/hdts");
      const data = res.data;
      if (data) {
        setHdtList(data);
        if (!highlightedDT && (data).length > 0) {
          setHighlightedDT(data[0]);
        }
      } else {
        setHdtList([]);
      }
    } catch (e) {
      console.error("Failed to fetch HDTs", e);
    }
  };

  const uploadExcel = async () => {
    if (!excelInput) return;

    setCreating(true);
    try {
      const form = new FormData();
      form.append("file", excelInput, excelInput.name); // "file" must match the server fieldName

      const res = await fetch("/api/creation/hdts/multipart", {
        method: "POST",
        body: form, // <-- browser sets multipart + boundary
      });

      if (res.ok) {
        await fetchHdts(); // Refresh list
        alert("Excel uploaded successfully!");
        setExcelInput(null);
      } else {
        alert("Failed to upload Excel: " + res.statusText + "/t" + await res.text());
      }
    } catch (err) {
      console.error("Excel upload failed", err);
      alert("Error reading or uploading Excel file");
    } finally {
      setCreating(false);
    }
  }

  const loadJsonFromFiles = async (files: FileList) => {
    setJsonStatus(null);

    const errors: string[] = [];
    const combined: unknown[] = [];

    for (const file of Array.from(files)) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch (e) {
        errors.push(`${file.name}: Invalid JSON — ${(e as Error).message}`);
        continue;
      }

      if (Array.isArray(parsed)) {
        combined.push(...parsed);
      } else if (parsed !== null && typeof parsed === "object") {
        combined.push(parsed);
      } else {
        errors.push(`${file.name}: Expected a JSON object or an array of objects`);
      }
    }

    setFileErrors(errors);
    if (combined.length > 0) {
      setJsonText(JSON.stringify(combined, null, 2));
    }
  };

  const submitJson = async () => {
    setJsonStatus(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      setJsonStatus({ kind: "error", message: `Invalid JSON: ${(e as Error).message}` });
      return;
    }

    // Normalize to an array of objects. A single object is wrapped; a top-level
    // value that is neither object nor array is rejected here. Element-level
    // shape validation is delegated to the backend's index-aware 400s.
    let payload: unknown[];
    if (Array.isArray(parsed)) {
      payload = parsed;
    } else if (parsed !== null && typeof parsed === "object") {
      payload = [parsed];
    } else {
      setJsonStatus({ kind: "error", message: "Expected a JSON object or an array of objects" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/creation/hdts/json/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const ids: string[] = Array.isArray(data) ? data : [];
        await fetchHdts();
        setJsonText("");
        setFileErrors([]);
        setJsonStatus({ kind: "success", message: formatCreatedMessage(ids) });
      } else {
        const msg = await res.text();
        setJsonStatus({ kind: "error", message: msg || res.statusText });
      }
    } catch {
      setJsonStatus({ kind: "error", message: "Request failed — could not reach the creation service" });
    } finally {
      setCreating(false);
    }
  };

  const addSensorFiles = (files: FileList) => {
    const added: SensorCsvEntry[] = Array.from(files).map((file) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      ...parseSensorFileName(file.name),
      status: { kind: "idle" },
    }));
    setSensorEntries((prev) => [...prev, ...added]);
  };

  const updateSensorEntry = (id: string, patch: Partial<SensorCsvEntry>) => {
    setSensorEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    );
  };

  const removeSensorEntry = (id: string) => {
    setSensorEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const uploadSensorCsvs = async () => {
    if (sensorEntries.length === 0 || sensorUploading) return;

    setSensorUploading(true);
    try {
      // Upload sequentially so each file reports its own status independently;
      // one file failing does not abort the rest.
      for (const entry of sensorEntries) {
        const patientId = entry.patientId.trim();
        const task = entry.task.trim();
        const sensor = entry.sensor.trim();

        if (!patientId || !task || !sensor) {
          updateSensorEntry(entry.id, {
            status: {
              kind: "error",
              message: "patientId, task and sensor are all required",
            },
          });
          continue;
        }

        updateSensorEntry(entry.id, { status: { kind: "uploading" } });

        try {
          const form = new FormData();
          form.append("file", entry.file, entry.file.name);
          form.append("patientId", patientId);
          form.append("task", task);
          form.append("sensor", sensor);

          const res = await fetch(SENSOR_CSV_ENDPOINT, {
            method: "POST",
            body: form, // browser sets multipart + boundary
          });

          if (res.ok) {
            updateSensorEntry(entry.id, {
              status: { kind: "success", message: "Uploaded" },
            });
          } else {
            const msg = await res.text();
            updateSensorEntry(entry.id, {
              status: { kind: "error", message: msg || res.statusText },
            });
          }
        } catch {
          updateSensorEntry(entry.id, {
            status: {
              kind: "error",
              message: "Request failed — could not reach the creation service",
            },
          });
        }
      }

      await fetchHdts(); // Refresh list with any newly created HDTs/models
    } finally {
      setSensorUploading(false);
    }
  };

  useEffect(() => {
    fetchHdts();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <LoadingOverlay open={creating} message="Creating HDTs…" mode="blocking" />

      {/* Import mode toggle */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded ${importMode === "excel" ? "bg-blue-600 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-500"}`}
          onClick={() => setImportMode("excel")}
        >
          Excel (CRF)
        </button>
        <button
          className={`px-4 py-2 rounded ${importMode === "json" ? "bg-blue-600 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-500"}`}
          onClick={() => setImportMode("json")}
        >
          JSON
        </button>
        <button
          className={`px-4 py-2 rounded ${importMode === "sensorCsv" ? "bg-blue-600 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-500"}`}
          onClick={() => setImportMode("sensorCsv")}
        >
          Sensor CSV
        </button>
      </div>

      {/* Excel import block */}
      {importMode === "excel" && (
        <div className="w-full">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setExcelInput(e.target.files?.[0] || null)}
            className="text-sm text-white"
          />
          <button
            className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={uploadExcel}
            disabled={!excelInput}
          >
            Upload Excel
          </button>
        </div>
      )}

      {/* JSON import block */}
      {importMode === "json" && (
        <div className="w-full space-y-2">
          <textarea
            className="w-full h-40 bg-gray-800 text-white p-2 rounded font-mono text-sm resize-y"
            placeholder="Paste a JSON object or an array of objects…"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 cursor-pointer">
              Load from file…
              <input
                type="file"
                accept=".json"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) loadJsonFromFiles(files);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={submitJson}
              disabled={!jsonText.trim()}
            >
              Submit JSON
            </button>
          </div>
          {fileErrors.length > 0 && (
            <ul data-testid="json-file-errors" className="text-sm text-red-400 list-disc pl-5">
              {fileErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
          {jsonStatus && (
            <p
              data-testid="json-import-status"
              className={`text-sm ${jsonStatus.kind === "success" ? "text-green-400" : "text-red-400"}`}
            >
              {jsonStatus.message}
            </p>
          )}
        </div>
      )}

      {/* Sensor CSV import block */}
      {importMode === "sensorCsv" && (
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2">
            <label className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 cursor-pointer">
              Add CSV files…
              <input
                type="file"
                accept=".csv"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) addSensorFiles(files);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              onClick={uploadSensorCsvs}
              disabled={sensorEntries.length === 0 || sensorUploading}
            >
              {sensorUploading ? "Uploading…" : "Upload all"}
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Files are pre-parsed as{" "}
            <code>&lt;patientId&gt;_&lt;task&gt;_&lt;sensor&gt;.csv</code>. The
            convention isn&apos;t guaranteed — review and edit the fields below
            before uploading. Each sensor becomes a normal model, visible in the
            Query Workbench model filter.
          </p>

          {sensorEntries.length > 0 && (
            <div className="overflow-x-auto">
              <table
                data-testid="sensor-csv-table"
                className="w-full text-sm text-white border-collapse"
              >
                <thead>
                  <tr className="text-left text-gray-300">
                    <th className="p-2">File</th>
                    <th className="p-2">Patient ID</th>
                    <th className="p-2">Task</th>
                    <th className="p-2">Sensor</th>
                    <th className="p-2">Status</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sensorEntries.map((entry) => (
                    <tr key={entry.id} className="border-t border-gray-700">
                      <td className="p-2 max-w-[16rem] truncate" title={entry.file.name}>
                        {entry.file.name}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="w-32 bg-gray-800 text-white p-1 rounded"
                          value={entry.patientId}
                          onChange={(e) =>
                            updateSensorEntry(entry.id, { patientId: e.target.value })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="w-32 bg-gray-800 text-white p-1 rounded"
                          value={entry.task}
                          onChange={(e) =>
                            updateSensorEntry(entry.id, { task: e.target.value })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className="w-32 bg-gray-800 text-white p-1 rounded"
                          value={entry.sensor}
                          onChange={(e) =>
                            updateSensorEntry(entry.id, { sensor: e.target.value })
                          }
                        />
                      </td>
                      <td className="p-2">
                        {entry.status.kind === "uploading" && (
                          <span className="text-blue-400">Uploading…</span>
                        )}
                        {entry.status.kind === "success" && (
                          <span className="text-green-400">{entry.status.message}</span>
                        )}
                        {entry.status.kind === "error" && (
                          <span className="text-red-400">{entry.status.message}</span>
                        )}
                        {entry.status.kind === "idle" && (
                          <span className="text-gray-500">Ready</span>
                        )}
                      </td>
                      <td className="p-2">
                        <button
                          className="text-gray-400 hover:text-red-400 disabled:opacity-40"
                          onClick={() => removeSensorEntry(entry.id)}
                          disabled={sensorUploading}
                          aria-label={`Remove ${entry.file.name}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bottom Split View */}
      <div className="flex flex-row gap-4">
        {/* HDT List */}
        <div className="w-1/3 bg-gray-800 text-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Available HumanDigitalTwins</h2>
          <SearchableHdtSelect
            hdtIds={hdtList.map((hdt) => hdt.hdtId)}
            value={highlightedDT?.hdtId ?? null}
            onChange={(id) =>
              setHighlightedDT(hdtList.find((hdt) => hdt.hdtId === id) ?? null)
            }
            label="Digital Twin"
          />
        </div>

        {/* HDT Details */}
        <div className="flex-1 min-w-0">
          {highlightedDT && <HdtTaskView id={highlightedDT.hdtId} />}
        </div>
      </div>
    </div>
  );
}
