"use client";

import { useState } from "react";
import { ObservationQueryPanel } from "./panels/ObservationQueryPanel";
import { PropertyTagQueryPanel } from "./panels/PropertyTagQueryPanel";
import { ViewsPanel } from "./panels/ViewsPanel";

type TabKey = "observation" | "property" | "views";

const TABS: { key: TabKey; label: string }[] = [
  { key: "observation", label: "Observation" },
  { key: "property", label: "Property" },
  { key: "views", label: "Views" },
];

export default function QueryWorkbench() {
  const [activeTab, setActiveTab] = useState<TabKey>("observation");

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center p-6">
      <div className="w-full max-w-6xl bg-gray-800 p-8 rounded-xl shadow-xl text-white">
        <h1 className="text-2xl font-bold mb-6">Query Workbench</h1>

        <div className="flex gap-2 mb-6 border-b border-gray-600">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-t font-semibold transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "observation" && <ObservationQueryPanel />}
        {activeTab === "property" && <PropertyTagQueryPanel />}
        {activeTab === "views" && <ViewsPanel />}
      </div>
    </div>
  );
}
