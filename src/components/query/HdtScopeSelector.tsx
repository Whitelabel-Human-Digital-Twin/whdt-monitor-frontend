"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { SearchableHdtSelect } from "@/components/common/SearchableHdtSelect";

interface HdtScopeSelectorProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

export function HdtScopeSelector({ selected, onChange }: HdtScopeSelectorProps) {
  const [hdtIds, setHdtIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .GET("/hdts")
      .then((res) => {
        if (res.data) {
          setHdtIds(res.data.map((hdt) => hdt.hdtId));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Loading…</p>;

  if (hdtIds.length === 0) return <p className="text-gray-400">No digital twins found.</p>;

  return (
    <SearchableHdtSelect
      multiple
      hdtIds={hdtIds}
      value={selected}
      onChange={onChange}
      label="Digital Twins"
    />
  );
}
