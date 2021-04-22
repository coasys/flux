import type Address from "ad4m/Address";
import type Agent from "ad4m/Agent";
import type Language from "ad4m/Language";
import type LanguageContext from "ad4m/LanguageContext";
import type { Interaction } from "ad4m/Language";
import type HolochainLanguageDelegate from "language-context/lib/Holochain/HolochainLanguageDelegate";
import { JuntoSocialContextLinkAdapter } from "./linksAdapter";
import { JuntoSettingsUI } from "./settingsUI";
import { DNA, DNA_NICK } from "./dna";

function interactions(a: Agent, expression: Address): Interaction[] {
  return [];
}

export const name = "social-context-core";

export default function create(context: LanguageContext): Language {
  const Holochain = context.Holochain as HolochainLanguageDelegate;
  Holochain.registerDNAs([{ file: DNA, nick: DNA_NICK }]);

  const linksAdapter = new JuntoSocialContextLinkAdapter(context);
  const settingsUI = new JuntoSettingsUI();

  return {
    name,
    linksAdapter,
    settingsUI,
    interactions,
  } as Language;
}
