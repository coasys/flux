import type { Expression, LinkExpression } from "@perspect3vism/ad4m";
import { ExpressionRef } from "@perspect3vism/ad4m";

export interface ExpressionAndRef {
  expression: Expression;
  url: ExpressionRef;
}

export interface LinkExpressionAndLang {
  expression: LinkExpression;
  language: string;
  hash: () => number;
}

export interface ExpressionAndRef {
  expression: Expression;
  url: ExpressionRef;
}
