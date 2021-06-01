import type Address from "@perspect3vism/ad4m/Address";
import type Agent from "@perspect3vism/ad4m/Agent";
import type Language from "@perspect3vism/ad4m/Language";
import type LanguageContext from "@perspect3vism/ad4m-language-context/LanguageContext";
import type { Interaction } from "@perspect3vism/ad4m/Language";
import type HolochainLanguageDelegate from "@perspect3vism/ad4m-language-context/Holochain/HolochainLanguageDelegate";
import type { ExpressionUI as ExpressionUIInterface } from "@perspect3vism/ad4m/Language";
import LanguageAdapter from "./languageAdapter";
import { DNA, DNA_NICK } from "./dna";
import Adapter from "./adapter";

export const name = "languages";

export class ExpressionUI implements ExpressionUIInterface {
  icon(): string {
    return "";
  }

  constructorIcon(): string {
    return "";
  }
}

function interactions(a: Agent, expression: Address): Interaction[] {
  return [];
}

export default async function create(context: LanguageContext): Promise<Language> {
  const Holochain = context.Holochain as HolochainLanguageDelegate;
  await Holochain.registerDNAs([{ file: DNA, nick: DNA_NICK }]);

  const expressionAdapter = new Adapter(context);
  const expressionUI = new ExpressionUI();
  const languageAdapter = new LanguageAdapter(context);

  return {
    name,
    expressionAdapter,
    expressionUI,
    languageAdapter,
    interactions,
  } as Language;
}
