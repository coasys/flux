import type Language from "@perspect3vism/ad4m/Language";

// @ts-ignore
import ConstructorIcon from "inline:./icons/constructor-icon.js";
// @ts-ignore
import ExpressionIcon from "inline:./icons/expression-icon.js";

export default async function create(context) {
  return {
    name: "junto-youtube",
    expressionAdapter: {
      putAdapter: {
        addressOf: (content: any) => content.url,
      },
      get() {
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
  } as Language;
}
