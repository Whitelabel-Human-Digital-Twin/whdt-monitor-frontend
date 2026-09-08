import { useEffect, useState } from "react";
import { ModelDocument } from "@/lib/api/schema";
import { api } from "@/lib/api/client";

export type ModelOption = { modelName: string; isSensor: boolean };

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

/** Fetches GET /models, dedupes by name, marks sensors via tags.origin === "sensorCsv". */
export function useModelOptions(): {
  options: ModelOption[];
  loading: boolean;
  error: string | null;
} {
  const [options, setOptions] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api.GET("/models").then((res) => {
      if (cancelled) return;
      if (res.data) {
        setOptions(deriveModelOptions(res.data));
      } else {
        setError("Failed to load models");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading, error };
}
