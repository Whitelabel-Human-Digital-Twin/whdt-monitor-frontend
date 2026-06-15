"use client";

import { useCallback, useEffect, useState } from "react";
import { TagPredicate, ViewDocument } from "@/lib/api/schema";
import { api } from "@/lib/api/client";
import { TagPredicateBuilder } from "@/components/query/TagPredicateBuilder";
import { HdtScopeSelector } from "@/components/query/HdtScopeSelector";
import { ViewResultTree, ViewNode } from "@/components/query/ViewResultTree";

type ViewDraft = {
  name: string;
  predicate: TagPredicate | null;
  groupByKeys: string[];
};

function GroupByKeysEditor({
  keys,
  onChange,
}: {
  keys: string[];
  onChange: (next: string[]) => void;
}) {
  const addKey = () => onChange([...keys, ""]);
  const removeKey = (i: number) => onChange(keys.filter((_, j) => j !== i));
  const updateKey = (i: number, val: string) =>
    onChange(keys.map((k, j) => (j === i ? val : k)));

  return (
    <div className="space-y-1">
      {keys.map((k, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="flex-1 p-1 bg-gray-700 border border-gray-600 rounded text-sm"
            placeholder="tag key"
            value={k}
            onChange={(e) => updateKey(i, e.target.value)}
          />
          <button
            className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs"
            onClick={() => removeKey(i)}
          >
            ×
          </button>
        </div>
      ))}
      <button
        className="mt-1 bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-xs"
        onClick={addKey}
      >
        + Add group key
      </button>
    </div>
  );
}

function ViewEditor({
  initial,
  isNew,
  onSaved,
  onCancel,
}: {
  initial: ViewDraft;
  isNew: boolean;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ViewDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body = {
        name: draft.name.trim(),
        predicate: draft.predicate ?? undefined,
        groupByKeys: draft.groupByKeys.filter(Boolean),
      };

      if (isNew) {
        const { error: err } = await api.POST("/views", { body });
        if (err) { setError("Failed to create view."); return; }
      } else {
        const { error: err } = await api.PUT("/views/{name}", {
          params: { path: { name: initial.name } },
          body,
        });
        if (err) { setError("Failed to update view."); return; }
      }
      onSaved();
    } catch {
      setError("Unexpected error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-700 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-bold">{isNew ? "New View" : `Edit: ${initial.name}`}</h2>

      {error && (
        <div className="p-3 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-1 text-sm font-semibold">Name</label>
        <input
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm disabled:opacity-50"
          value={draft.name}
          disabled={!isNew}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="view-name"
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-semibold">Tag Predicate (optional)</label>
        <TagPredicateBuilder
          value={draft.predicate}
          onChange={(p) => setDraft({ ...draft, predicate: p })}
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-semibold">Group By Keys (ordered)</label>
        <GroupByKeysEditor
          keys={draft.groupByKeys}
          onChange={(groupByKeys) => setDraft({ ...draft, groupByKeys })}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded font-semibold text-sm"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded font-semibold text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ExecuteSection({ viewName }: { viewName: string }) {
  const [hdtScope, setHdtScope] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ViewNode> | null>(null);

  const handleExecute = async () => {
    setError(null);
    setResults(null);
    setRunning(true);
    try {
      const { data, error: err } = await api.POST("/views/{name}/execute", {
        params: { path: { name: viewName } },
        body: { hdtIds: hdtScope.length > 0 ? hdtScope : undefined },
      });
      if (err) { setError("Execute failed."); return; }
      if (!data || Object.keys(data).length === 0) {
        setResults({});
        return;
      }
      setResults(data as unknown as Record<string, ViewNode>);
    } catch {
      setError("Unexpected error.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label className="block mb-1 text-sm font-semibold">HDT Scope (empty = all)</label>
        <HdtScopeSelector selected={hdtScope} onChange={setHdtScope} />
      </div>
      <button
        onClick={handleExecute}
        disabled={running}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded font-semibold text-sm"
      >
        {running ? "Running…" : `Execute "${viewName}"`}
      </button>
      {error && (
        <div className="p-3 bg-red-900 border border-red-600 rounded text-red-200 text-sm">{error}</div>
      )}
      {results !== null && Object.keys(results).length === 0 && !error && (
        <div className="p-4 bg-gray-700 rounded-lg text-gray-400 text-center text-sm">
          No results returned.
        </div>
      )}
      {results !== null && Object.keys(results).length > 0 && (
        <ViewResultTree resultsByHdt={results} />
      )}
    </div>
  );
}

export function ViewsPanel() {
  const [views, setViews] = useState<ViewDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [editingDraft, setEditingDraft] = useState<ViewDraft | null>(null);
  const [editingIsNew, setEditingIsNew] = useState(false);

  const [expandedExecute, setExpandedExecute] = useState<string | null>(null);

  const loadViews = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const { data, error } = await api.GET("/views");
      if (error) { setListError("Failed to load views."); return; }
      setViews(data ?? []);
    } catch {
      setListError("Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadViews(); }, [loadViews]);

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete view "${name}"?`)) return;
    try {
      await api.DELETE("/views/{name}", { params: { path: { name } } });
      await loadViews();
    } catch {
      alert("Delete failed.");
    }
  };

  const handleNewView = () => {
    setEditingDraft({ name: "", predicate: null, groupByKeys: [] });
    setEditingIsNew(true);
  };

  const handleEditView = (view: ViewDocument) => {
    setEditingDraft({
      name: view.name,
      predicate: view.predicate ?? null,
      groupByKeys: view.groupByKeys ?? [],
    });
    setEditingIsNew(false);
  };

  const handleEditorSaved = async () => {
    setEditingDraft(null);
    await loadViews();
  };

  if (editingDraft) {
    return (
      <ViewEditor
        initial={editingDraft}
        isNew={editingIsNew}
        onSaved={handleEditorSaved}
        onCancel={() => setEditingDraft(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Saved Views</h2>
        <button
          onClick={handleNewView}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-semibold text-sm"
        >
          + New View
        </button>
      </div>

      {listError && (
        <div className="p-3 bg-red-900 border border-red-600 rounded text-red-200 text-sm">{listError}</div>
      )}

      {loading && <p className="text-gray-400">Loading…</p>}

      {!loading && views.length === 0 && !listError && (
        <div className="p-6 bg-gray-700 rounded-lg text-gray-400 text-center">
          No views saved yet. Click &quot;+ New View&quot; to create one.
        </div>
      )}

      {views.map((view) => (
        <div key={view.name} className="bg-gray-700 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold text-white">{view.name}</div>
              {view.groupByKeys && view.groupByKeys.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  Group by: {view.groupByKeys.join(" → ")}
                </div>
              )}
              {view.predicate && (
                <div className="text-xs text-gray-400 mt-1">
                  Predicate: {view.predicate.type}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setExpandedExecute(expandedExecute === view.name ? null : view.name)
                }
                className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1 rounded text-sm font-semibold"
              >
                {expandedExecute === view.name ? "Hide Execute" : "Execute"}
              </button>
              <button
                onClick={() => handleEditView(view)}
                className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm font-semibold"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(view.name)}
                className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>

          {expandedExecute === view.name && (
            <ExecuteSection viewName={view.name} />
          )}
        </div>
      ))}
    </div>
  );
}
