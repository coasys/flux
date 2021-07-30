import { ExpressionAndRef } from "@/store/types";

export function sortExpressionsByTimestamp(
  expressions: {
    [x: string]: ExpressionAndRef;
  },
  order: "asc" | "desc"
): ExpressionAndRef[] {
  return Object.values(expressions).sort((a, b) => {
    if (order === "asc") {
      return (
        new Date(a.expression.timestamp).getTime() -
        new Date(b.expression.timestamp).getTime()
      );
    } else {
      return (
        new Date(b.expression.timestamp).getTime() -
        new Date(a.expression.timestamp).getTime()
      );
    }
  });
}
