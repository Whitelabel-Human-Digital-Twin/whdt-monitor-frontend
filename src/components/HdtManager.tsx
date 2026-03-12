"use client";

import { useEffect, useState } from "react";
import HdtDetail from "@/components/HdtDetail"; // adjust path based on your structure

export default function HdtManager() {
  const [hdtList, setHdtList] = useState<string[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [excelInput, setExcelInput] = useState<File | null>(null);

  const fetchHdts = async () => {
    try {
      const res = await fetch("/api/hdt");
      const data = await res.json();
      setHdtList(data);
      if (!highlightedId && data.length > 0) {
        setHighlightedId(data[0]);
      }
    } catch (e) {
      console.error("Failed to fetch HDTs", e);
    }
  };

  const uploadExcel = async () => {
    if (!excelInput) return;

    try {
      const form = new FormData();
      form.append("file", excelInput, excelInput.name); // "file" must match the server fieldName

      const res = await fetch("/api/hdts/multipart", {
        method: "POST",
        body: form, // <-- browser sets multipart + boundary
      });

      if (res.ok) {
        await fetchHdts(); // Refresh list
        alert("Excel uploaded successfully!");
        setExcelInput(null);
      } else {
        alert("Failed to upload Excel: " + res.statusText);
      }
    } catch (err) {
      console.error("Excel upload failed", err);
      alert("Error reading or uploading Excel file");
    }
  }

  useEffect(() => {
    fetchHdts();
  }, []);

  return (
    <div className="p-4 space-y-4">
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

      {/* Bottom Split View */}
      <div className="flex flex-row gap-4">
        {/* HDT List */}
        <div className="w-1/3 bg-gray-800 text-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Available HumanDigitalTwins</h2>
          <ul className="space-y-1">
            {hdtList.map((id) => (
              <li
                key={id}
                onClick={() => setHighlightedId(id)}
                className={`cursor-pointer hover:underline ${highlightedId === id ? "text-blue-400 font-bold" : "text-white"}`}
              >
                {id}
              </li>
            ))}
          </ul>
        </div>

        {/* HDT Details */}
        <div className="flex-1">
          {highlightedId && <HdtDetail id={highlightedId} />}
        </div>
      </div>
    </div>
  );
}
