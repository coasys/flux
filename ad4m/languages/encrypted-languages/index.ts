import type Address from "ad4m/Address";
import type Agent from "ad4m/Agent";
import type Language from "ad4m/Language";
import type LanguageContext from "language-context/lib/LanguageContext";
import type { Interaction } from "ad4m/Language";
import type HolochainLanguageDelegate from "language-context/lib/Holochain/HolochainLanguageDelegate";
import type { ExpressionUI as ExpressionUIInterface } from "ad4m/Language";
import LanguageAdapter from "./languageAdapter";
import { DNA, DNA_NICK } from "./dna";
import Adapter from "./adapter";

export const name = "encrypted-languages";

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

export default function create(context: LanguageContext): Language {
  const Holochain = context.Holochain as HolochainLanguageDelegate;
  Holochain.registerDNAs([{ file: DNA, nick: DNA_NICK }]);

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
