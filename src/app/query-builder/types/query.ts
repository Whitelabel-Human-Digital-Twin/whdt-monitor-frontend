// src/types/query.ts
export type AggregateOperation = "avg" | "min" | "max";

export type FilterOperator = "<" | ">" | "=" | "<=" | ">=";

export function toWhdtComparisonOp(f: FilterOperator): string {
  switch(f) {
    case "<": return "LT"
    case ">": return "GT"
    case "=": return "EQ"
    case "<=": return "LTE"
    case ">=": return "GTE"
  }
}

export interface QueryFilter {
  propertyName: string;
  op: FilterOperator;
  value: number;
}

export interface AggregateQuery {
  operation: AggregateOperation;
  property: string;
  dts: string[];
  models: string[]
}