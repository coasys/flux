import type { Expression, LinkExpression } from "@perspect3vism/ad4m";
import { ExpressionRef } from "@perspect3vism/ad4m";

export interface FluxExpressionReference {
  languageAddress: string;
  expressionType: ExpressionTypes;
}

export enum ExpressionTypes {
  ShortForm,
  GroupExpression,
  ProfileExpression,
  Other,
}

export interface ExpressionAndRef {
  expression: Expression;
  url: ExpressionRef;
}

export interface LinkExpressionAndLang {
  expression: LinkExpression;
  language: string;
}

export interface ExpressionAndRef {
  expression: Expression;
  url: ExpressionRef;
}
