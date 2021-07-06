import type Language from "@perspect3vism/ad4m/Language";
import type LanguageContext from "@perspect3vism/ad4m/LanguageContext";

// @ts-ignore
import ConstructorIcon from "inline:./icons/constructor-icon.js";
// @ts-ignore
import ExpressionIcon from "inline:./icons/expression-icon.js";

export default async function create(
  context: LanguageContext
): Promise<Language> {
  return {
    name: "junto-youtube",
    expressionAdapter: {
      putAdapter: {
        addressOf: async (content: any) => content.url,
      },
      async get() {
        return null;
      },
    },
    expressionUI: {
      constructorIcon() {
        return ConstructorIcon;
      },
      icon() {
        return ExpressionIcon;
      },
    },
    settingsUI: {
      settingsIcon() {
        return null;
      },
    },
    interactions: () => [],
  };
}
