import type Address from "@perspect3vism/ad4m/Address";
import type Agent from "@perspect3vism/ad4m/Agent";
import type Language from "@perspect3vism/ad4m/Language";
import type LanguageContext from "@perspect3vism/ad4m-language-context/LanguageContext";
import type { Interaction } from "@perspect3vism/ad4m/Language";
import type HolochainLanguageDelegate from "@perspect3vism/ad4m-language-context/Holochain/HolochainLanguageDelegate";
import { JuntoSocialContextLinkAdapter } from "./linksAdapter";
import { JuntoSettingsUI } from "./settingsUI";
import { DNA, DNA_NICK } from "./dna";

function interactions(a: Agent, expression: Address): Interaction[] {
  return [];
}

export const name = "social-context-channel";

export default function create(context: LanguageContext): Language {
  const Holochain = context.Holochain as HolochainLanguageDelegate;

  const linksAdapter = new JuntoSocialContextLinkAdapter(context);
  const settingsUI = new JuntoSettingsUI();

  Holochain.registerDNAs(
    [{ file: DNA, nick: DNA_NICK }],
    linksAdapter.handleHolochainSignal.bind(context)
  );

  return {
    name,
    linksAdapter,
    settingsUI,
    interactions,
  } as Language;
}
