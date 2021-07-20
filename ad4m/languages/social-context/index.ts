import type {
  Address,
  LanguageContext,
  Language,
  Interaction,
  HolochainLanguageDelegate,
} from "@perspect3vism/ad4m";
import { JuntoSocialContextLinkAdapter } from "./linksAdapter";
import { JuntoSettingsUI } from "./settingsUI";
import { DNA, DNA_NICK } from "./dna";

function interactions(expression: Address): Interaction[] {
  return [];
}

export const name = "social-context";

export default async function create(
  context: LanguageContext
): Promise<Language> {
  const Holochain = context.Holochain as HolochainLanguageDelegate;
  await Holochain.registerDNAs([{ file: DNA, nick: DNA_NICK }]);

  const linksAdapter = new JuntoSocialContextLinkAdapter(context);
  const settingsUI = new JuntoSettingsUI();

  return {
    name,
    linksAdapter,
    settingsUI,
    interactions,
  } as Language;
}
