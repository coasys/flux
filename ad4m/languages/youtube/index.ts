import type LanguageContext from "@perspect3vism/ad4m/LanguageContext";
import type Language from "@perspect3vism/ad4m/Language";
import type { Interaction } from "@perspect3vism/ad4m/Language";
import ConstructorIcon from "./constructor-icon.js";

export const name = "junto-youtube";

export interface Content {
  url: string;
}

function PutAdapter() {
  this.addressOf = async (content) => content.url;
}

function ExpressionAdapter() {
  this.putAdapter = new PutAdapter();
  this.get = () => {};
}

function interactions(): Interaction[] {
  return [];
}

export default async function create(
  context: LanguageContext
): Promise<Language> {
  return {
    name,
    expressionAdapter: new ExpressionAdapter(),
    expressionUI: {
      constructorIcon() {
        return ConstructorIcon as string;
      },
      icon() {
        return ConstructorIcon as string;
      },
    },
    interactions,
  } as Language;
}
