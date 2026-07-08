"use client";

import { useEffect, useState } from "react";
import HdtTaskView from "@/components/HdtTaskView";
import { api } from "@/lib/api/client";
import { HumanDigitalTwinDocument } from "@/lib/api/schema";
import { SearchableHdtSelect } from "@/components/common/SearchableHdtSelect";
import { LoadingOverlay } from "@/components/common/LoadingOverlay";

type ImportMode = "excel" | "json";
type JsonStatus = { kind: "error" | "success"; message: string } | null;

const MAX_IDS_SHOWN = 10;

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
