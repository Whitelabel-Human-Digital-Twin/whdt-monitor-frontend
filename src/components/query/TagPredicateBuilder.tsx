"use client";

import { type ReactElement } from "react";
import { TagPredicate } from "@/lib/api/schema";

type VariantKey = "eq" | "in" | "has" | "and" | "or" | "not";

const VARIANTS: VariantKey[] = ["eq", "in", "has", "and", "or", "not"];

interface TagPredicateBuilderProps {
  value: TagPredicate | null;
  onChange: (next: TagPredicate | null) => void;
}

export function TagPredicateBuilder({ value, onChange }: TagPredicateBuilderProps): ReactElement {
  const currentType: VariantKey | "none" = value?.type ?? "none";

  const handleTypeChange = (newType: string) => {
    if (newType === "none") {
      onChange(null);
      return;
    }

    const prevKey = value && "key" in value ? value.key : "";

    switch (newType as VariantKey) {
      case "eq":
        onChange({ type: "eq", key: prevKey, value: "" });
        break;
      case "in":
        onChange({ type: "in", key: prevKey, values: [] });
        break;
      case "has":
        onChange({ type: "has", key: prevKey });
        break;
      case "and":
        onChange({ type: "and", terms: [] });
        break;
      case "or":
        onChange({ type: "or", terms: [] });
        break;
      case "not":
        onChange({ type: "not", term: { type: "has", key: "" } });
        break;
    }
  };

  const updateTerm = (
    base: { type: "and"; terms: TagPredicate[] } | { type: "or"; terms: TagPredicate[] },
    i: number,
    next: TagPredicate | null
  ) => {
    const terms = [...base.terms];
    if (next === null) {
      terms.splice(i, 1);
    } else {
      terms[i] = next;
    }
    onChange({ ...base, terms });
  };

  const removeTerm = (
    base: { type: "and"; terms: TagPredicate[] } | { type: "or"; terms: TagPredicate[] },
    i: number
  ) => {
    const terms = base.terms.filter((_, j) => j !== i);
    onChange({ ...base, terms });
  };

  const addTerm = (
    base: { type: "and"; terms: TagPredicate[] } | { type: "or"; terms: TagPredicate[] }
  ) => {
    onChange({ ...base, terms: [...base.terms, { type: "has", key: "" }] });
  };

  return (
    <div className="border border-gray-600 rounded p-3 bg-gray-800">
      <select
        className="mb-2 p-1 bg-gray-700 border border-gray-600 rounded text-sm"
        value={currentType}
        onChange={(e) => handleTypeChange(e.target.value)}
      >
        <option value="none">— none —</option>
        {VARIANTS.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>

      {value?.type === "eq" && (
        <div className="flex gap-2 mt-1">
          <input
            className="p-1 bg-gray-700 border border-gray-600 rounded text-sm flex-1"
            placeholder="key"
            value={value.key}
            onChange={(e) => onChange({ ...value, key: e.target.value })}
          />
          <input
            className="p-1 bg-gray-700 border border-gray-600 rounded text-sm flex-1"
            placeholder="value"
            value={value.value}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
          />
        </div>
      )}

      {value?.type === "in" && (
        <div className="mt-1 space-y-1">
          <input
            className="p-1 bg-gray-700 border border-gray-600 rounded text-sm w-full"
            placeholder="key"
            value={value.key}
            onChange={(e) => onChange({ ...value, key: e.target.value })}
          />
          <input
            className="p-1 bg-gray-700 border border-gray-600 rounded text-sm w-full"
            placeholder="values (comma-separated)"
            value={value.values.join(",")}
            onChange={(e) =>
              onChange({
                ...value,
                values: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      )}

      {value?.type === "has" && (
        <input
          className="mt-1 p-1 bg-gray-700 border border-gray-600 rounded text-sm w-full"
          placeholder="key"
          value={value.key}
          onChange={(e) => onChange({ ...value, key: e.target.value })}
        />
      )}

      {(value?.type === "and" || value?.type === "or") && (
        <div className="mt-2 space-y-2 pl-3 border-l border-gray-600">
          {value.terms.map((term, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <TagPredicateBuilder
                  value={term}
                  onChange={(next) => updateTerm(value, i, next)}
                />
              </div>
              <button
                className="mt-1 bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs"
                onClick={() => removeTerm(value, i)}
              >
                X
              </button>
            </div>
          ))}
          <button
            className="mt-1 bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-xs"
            onClick={() => addTerm(value)}
          >
            + Add Term
          </button>
        </div>
      )}

      {value?.type === "not" && (
        <div className="mt-2 pl-3 border-l border-gray-600">
          <TagPredicateBuilder
            value={value.term}
            onChange={(next) =>
              onChange({ ...value, term: next ?? { type: "has", key: "" } })
            }
          />
        </div>
      )}
    </div>
  );
}
