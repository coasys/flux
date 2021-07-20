import type {
  Address,
  Language,
  HolochainLanguageDelegate,
  LanguageContext,
  Interaction,
  ExpressionUI as ExpressionUIInterface,
} from "@perspect3vism/ad4m";
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

function interactions(expression: Address): Interaction[] {
  return [];
}

export default async function create(
  context: LanguageContext
): Promise<Language> {
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
