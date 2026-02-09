// src/types/query.ts
export type AggregateOperation = "avg" | "min" | "max";

export type FilterOperator = "<" | ">" | "=" | "<=" | ">=";

export interface QueryFilter {
  propertyName: string;
  op: FilterOperator;
  value: number;
}

export interface AggregateQuery {
  operation: AggregateOperation;
  property: string;
  filters: QueryFilter[];
  dts: string[];
}
