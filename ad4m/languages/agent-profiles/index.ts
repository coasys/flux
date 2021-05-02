import type Address from "ad4m/Address";
import type Agent from "ad4m/Agent";
import type Language from "ad4m/Language";
import type LanguageContext from "language-context/LanguageContext";
import type { Interaction } from "ad4m/Language";
import type HolochainLanguageDelegate from "language-context/Holochain/HolochainLanguageDelegate";
import AgentAdapter from "./agentAdapter";
import ExpressionAdapter from "./expressionAdapter";
import AgentExpressionUI from "./expressionUI";
import { DNA, DNA_NICK } from "./dna";

export const name = "agent-profiles";

function interactions(a: Agent, expression: Address): Interaction[] {
  return [];
}

export default function create(context: LanguageContext): Language {
  const Holochain = context.Holochain as HolochainLanguageDelegate;

  const agentAdapter = new AgentAdapter(context);
  const expressionAdapter = new ExpressionAdapter(context);
  const expressionUI = new AgentExpressionUI();

  Holochain.registerDNAs(
    [{ file: DNA, nick: DNA_NICK }],
    expressionAdapter.handleHolochainSignal
  );

  return {
    name,
    agentAdapter,
    expressionAdapter,
    expressionUI,
    interactions,
  } as Language;
}
