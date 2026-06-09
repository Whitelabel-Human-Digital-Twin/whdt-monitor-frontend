import { PropertyComparisonDto } from "@/lib/api/schema";

// src/types/query.ts
export type AggregateOperation = "avg" | "min" | "max";

export type FilterOperator = "<" | ">" | "=" | "<=" | ">=";

type ComparisonOp = PropertyComparisonDto["comparison"];

export function toWhdtComparisonOp(f: FilterOperator): ComparisonOp {
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