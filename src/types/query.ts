// src/types/query.ts
export type AggregateOperation = "avg" | "min" | "max";

export interface QueryFilter {
  field: string;
  operator: ">" | "<" | "=";
  value: number | string;
}

export interface AggregateQuery {
  operation: AggregateOperation;
  property: string;
  filters: QueryFilter[];
  dts: string[];
}
