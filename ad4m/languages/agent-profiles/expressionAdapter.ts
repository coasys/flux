import type { ExpressionAdapter as Interface } from "@perspect3vism/ad4m/Language";
import type Address from "@perspect3vism/ad4m/Address";
import Agent from "@perspect3vism/ad4m/Agent";
import type Expression from "@perspect3vism/ad4m/Expression";
import type { Ad4mSignalCB } from "@perspect3vism/ad4m-language-context/LanguageContext";
import type LanguageContext from "@perspect3vism/ad4m-language-context/LanguageContext";
import AgentPutAdapter from "./putAdapter";
import type HolochainLanguageDelegate from "@perspect3vism/ad4m-language-context/Holochain/HolochainLanguageDelegate";
import { DNA_NICK } from "./dna";
import { PERSPECTIVISM_PROFILE } from "./agentAdapter";

export default class ExpressionAdapter implements Interface {
  putAdapter: AgentPutAdapter;
  #holochain: HolochainLanguageDelegate;
  #ad4mSignalCb: Ad4mSignalCB;

  constructor(context: LanguageContext) {
    this.putAdapter = new AgentPutAdapter();
    this.#holochain = context.Holochain as HolochainLanguageDelegate;
  }

  async get(address: Address): Promise<void | Expression> {
    const result = await this.#holochain.call(
      DNA_NICK,
      "did-profiles",
      "get_profile",
      address
    );
    if (
      result &&
      result[PERSPECTIVISM_PROFILE] &&
      result[PERSPECTIVISM_PROFILE] != ""
    ) {
      const expr = JSON.parse(result[PERSPECTIVISM_PROFILE]);
      const agentExpression = expr as Expression;
      return agentExpression;
    } else {
      return null;
    }
  }

  handleHolochainSignal(signal: any) {
    console.log("Got holochain signal", signal);
    this.#ad4mSignalCb(signal);
  }
}
