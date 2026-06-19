"use client";

import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import { api } from "@/lib/api/client";

interface PropertyTagEditorProps {
  hdtId: string;
  propertyId: string;
  propertyName: string;
  initialTags: Record<string, string>;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function PropertyTagEditor({
  hdtId,
  propertyId,
  propertyName,
  initialTags,
  open,
  onClose,
  onSaved,
}: PropertyTagEditorProps) {
  const [rows, setRows] = useState<{ key: string; value: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRows(Object.entries(initialTags).map(([key, value]) => ({ key, value })));
      setError(null);
    }
  }, [open, initialTags]);

  const updateRow = (index: number, field: "key" | "value", val: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: val } : r)));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleSave = async () => {
    const keys = rows.map((r) => r.key.trim());
    if (keys.some((k) => k === "")) {
      setError("Tag keys cannot be empty.");
      return;
    }
    if (new Set(keys).size !== keys.length) {
      setError("Duplicate tag keys are not allowed.");
      return;
    }

    const body = Object.fromEntries(rows.map((r) => [r.key.trim(), r.value]));
    setSaving(true);
    setError(null);
    const { error: err } = await api.PUT("/hdts/{id}/properties/{propertyId}/tags", {
      params: { path: { id: hdtId, propertyId } },
      body,
    });
    setSaving(false);
    if (err) {
      setError("Failed to save tags.");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: "#111827",
          color: "#fff",
          border: "1px solid #374151",
        },
      }}
    >
      <DialogTitle sx={{ color: "#fff", borderBottom: "1px solid #374151" }}>
        Tags — {propertyName}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <div className="mb-3 p-3 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <TextField
                size="small"
                label="Key"
                value={row.key}
                onChange={(e) => updateRow(i, "key", e.target.value)}
                sx={{
                  flex: 1,
                  "& .MuiInputBase-root": { bgcolor: "#1f2937", color: "#fff" },
                  "& .MuiInputLabel-root": { color: "#9ca3af" },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#374151" },
                }}
              />
              <TextField
                size="small"
                label="Value"
                value={row.value}
                onChange={(e) => updateRow(i, "value", e.target.value)}
                sx={{
                  flex: 1,
                  "& .MuiInputBase-root": { bgcolor: "#1f2937", color: "#fff" },
                  "& .MuiInputLabel-root": { color: "#9ca3af" },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#374151" },
                }}
              />
              <IconButton
                onClick={() => removeRow(i)}
                size="small"
                sx={{ color: "#ef4444" }}
                aria-label="Remove tag"
              >
                ×
              </IconButton>
            </div>
          ))}
        </div>
        <Button
          onClick={addRow}
          size="small"
          sx={{ mt: 2, color: "#60a5fa", textTransform: "none" }}
        >
          + Add tag
        </Button>
      </DialogContent>
      <DialogActions sx={{ borderTop: "1px solid #374151", px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{ color: "#9ca3af", textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          sx={{
            bgcolor: "#2563eb",
            "&:hover": { bgcolor: "#1d4ed8" },
            "&.Mui-disabled": { bgcolor: "#374151", color: "#6b7280" },
            textTransform: "none",
          }}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
