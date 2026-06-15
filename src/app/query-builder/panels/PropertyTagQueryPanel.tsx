"use client";

import { useState } from "react";
import { TagPredicate } from "@/lib/api/schema";
import { api } from "@/lib/api/client";
import { TagPredicateBuilder } from "@/components/query/TagPredicateBuilder";
import { PropertyTable } from "@/components/query/PropertyTable";
import { fromPropertyDocument, PropertyRow } from "@/components/query/propertyRow";

export function PropertyTagQueryPanel() {
  const [predicate, setPredicate] = useState<TagPredicate | null>(null);
  const [results, setResults] = useState<PropertyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!predicate) {
      setError("Please define a predicate before running the query.");
      return;
    }

    setError(null);
    setEmpty(false);
    setResults([]);
    setLoading(true);

    try {
      const { data, error: err } = await api.POST("/query/property", {
        body: predicate,
      });

      if (err) {
        setError("Request failed");
        return;
      }

      if (!data || data.length === 0) {
        setEmpty(true);
        return;
      }

      setResults(data.map(fromPropertyDocument));
    } catch {
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-8 items-start">
      <div className="w-1/2">
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Tag Predicate</label>
          <TagPredicateBuilder value={predicate} onChange={setPredicate} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition px-6 py-3 rounded-lg font-semibold"
        >
          {loading ? "Running…" : "Run Query"}
        </button>
      </div>

      <div className="w-1/2">
        {error && (
          <div className="p-4 bg-red-900 border border-red-600 rounded-lg mb-4 text-red-200">
            {error}
          </div>
        )}

        {empty && !error && (
          <div className="p-4 bg-gray-700 rounded-lg mb-4 text-gray-400 text-center">
            No properties found.
          </div>
        )}

        {results.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Matching Properties</h2>
            <PropertyTable rows={results} />
          </div>
        )}
      </div>
    </div>
  );
}
