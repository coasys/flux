import type Address from "@perspect3vism/ad4m/Address";
import type Agent from "@perspect3vism/ad4m/Agent";
import type Language from "@perspect3vism/ad4m/Language";
import type { HolochainLanguageDelegate } from "@perspect3vism/ad4m/LanguageContext";
import type LanguageContext from "@perspect3vism/ad4m/LanguageContext";;
import type { Interaction } from "@perspect3vism/ad4m/Language";
import { JuntoSocialContextLinkAdapter } from "./linksAdapter";
import { JuntoSettingsUI } from "./settingsUI";
import { DNA, DNA_NICK } from "./dna";

function interactions(a: Agent, expression: Address): Interaction[] {
  return [];
}

export const name = "social-context";

export default async function create(context: LanguageContext): Promise<Language> {
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
