import type Address from "@perspect3vism/ad4m/Address";
import type Agent from "@perspect3vism/ad4m/Agent";
import type Language from "@perspect3vism/ad4m/Language";
import type LanguageContext from "@perspect3vism/ad4m-language-context/LanguageContext";
import type { Interaction } from "@perspect3vism/ad4m/Language";
import Adapter from "./adapter";
import type { ExpressionUI as Interface } from "@perspect3vism/ad4m/Language";

function interactions(a: Agent, expression: Address): Interaction[] {
  return [];
}

export class ExpressionUI implements Interface {
  icon(): string {
    return "";
  }

  constructorIcon(): string {
    return "";
  }
}

export const name = "shared-perspectives";

export default function create(context: LanguageContext): Language {
  const expressionAdapter = new Adapter(context);
  const expressionUI = new ExpressionUI();

  return {
    name,
    expressionAdapter,
    expressionUI,
    interactions,
  } as Language;
}
