import type Language from "@perspect3vism/ad4m/Language";
import YouTubeAdapter from "./adapter";
import type { ExpressionUI } from "@perspect3vism/ad4m/Language";
import type { Interaction } from "@perspect3vism/ad4m/Language";
import type LanguageContext from "@perspect3vism/ad4m/LanguageContext";

// @ts-ignore
import ConstructorIcon from "inline:./icons/constructor-icon.js";
// @ts-ignore
import ExpressionIcon from "inline:./icons/expression-icon.js";

function interactions(a: Agent, expression: Address): Interaction[] {
  return [];
}

export class YouTubeUI implements ExpressionUI {
  icon(): string {
    return ExpressionIcon;
  }

  constructorIcon(): string {
    return ConstructorIcon;
  }
}

export const name = "junto-youtube";

export default async function create(
  context: LanguageContext
): Promise<Language> {
  const expressionAdapter = new YouTubeAdapter(context);
  const expressionUI = new YouTubeUI();

  return {
    name,
    expressionAdapter,
    interactions,
    expressionUI,
  } as Language;
}
