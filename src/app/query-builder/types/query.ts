import { PropertyComparisonDto } from "@/lib/api/schema";

export type FilterOperator = "<" | ">" | "=" | "<=" | ">=";

type ComparisonOp = PropertyComparisonDto["comparison"];

export function toWhdtComparisonOp(f: FilterOperator): ComparisonOp {
  switch (f) {
    case "<":
      return "LT";
    case ">":
      return "GT";
    case "=":
      return "EQ";
    case "<=":
      return "LTE";
    case ">=":
      return "GTE";
  }
}
