import type Agent from "ad4m/Agent";
import type Expression from "ad4m/Expression";
import type { AgentAdapter as Interface } from "ad4m/Language";
import type LanguageContext from "language-context/lib/LanguageContext";
import type HolochainLanguageDelegate from "language-context/lib/Holochain/HolochainLanguageDelegate";
import { DNA_NICK } from './dna'

export const PERSPECTIVISM_PROFILE = "PERSPECTIVISM_PROFILE"

export default class AgentAdapter implements Interface {
    #holochain: HolochainLanguageDelegate
    #context: LanguageContext

    constructor(context: LanguageContext) {
        this.#holochain = context.Holochain as HolochainLanguageDelegate
        this.#context = context
    }

    async setProfile(agent: Agent) {
        const existingProfile = await this.getProfile(this.#context.agent.did)

        const oldAgent = JSON.stringify(existingProfile)
        const newAgent = JSON.stringify(agent)
        const changed = oldAgent !== newAgent

        if(!changed)
            return

        const expr = this.#context.agent.createSignedExpression(agent)
        const profile = { PERSPECTIVISM_PROFILE: JSON.stringify(expr)}

        if(!existingProfile) {
            const params = {
                did: agent.did,
                signed_agent: "TODO",
                profile
            }
            await this.#holochain.call(DNA_NICK, "did-profiles", "create_profile", params)
        }
        else if (changed) {
            const params = {
                did: agent.did,
                profile
            }
            await this.#holochain.call(DNA_NICK, "did-profiles", "update_profile", params)
        }
    }

    async getProfile(did: string): Promise<Agent|void> {
        const result = await this.#holochain.call(DNA_NICK, "did-profiles", "get_profile", did)
        if(result && result[PERSPECTIVISM_PROFILE] && result[PERSPECTIVISM_PROFILE] != "") {
            const agentExpression = JSON.parse(result[PERSPECTIVISM_PROFILE])
            const expr = agentExpression as Expression
            const agent = expr.data as Agent
            return agent
        } else {
            return null
        }
    }
}