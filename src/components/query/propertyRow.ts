import { PropertyDocument } from "@/lib/api/schema";

export type PropertyRow = {
  id?: string;
  name: string;
  modelId: string;
  declaredType: string;
  tags: Record<string, string>;
  coding?: { system: string; code: string };
  hdtId?: string;
};

export function fromPropertyDocument(d: PropertyDocument): PropertyRow {
  return {
    id: d.propertyId,
    name: d.propertyName,
    modelId: d.modelId,
    declaredType: d.declaredType,
    tags: d.tags ?? {},
    coding: d.coding,
    hdtId: d.hdtId,
  };
}
