import type Address from 'ad4m/Address'
import type AgentService from 'ad4m/AgentService'
import type { PublicSharing } from 'ad4m/Language'
import type LanguageContext from 'ad4m/LanguageContext'
import type { IPFSNode } from 'ad4m/LanguageContext'
import type HolochainLanguageDelegate from "language-context/lib/Holochain/HolochainLanguageDelegate"
import { DNA_NICK } from './dna'

export class IpfsPutAdapter implements PublicSharing {
    #agent: AgentService
    #IPFS: IPFSNode
    #holochain: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        this.#IPFS = context.IPFS
        this.#holochain = context.Holochain as HolochainLanguageDelegate
    }

    async createPublic(languageData: object): Promise<Address> {
        // @ts-ignore
        const { bundleFile, name, description } = languageData
        
        const ipfsAddress = await this.#IPFS.add({content: bundleFile.toString()})
        // @ts-ignore
        const hash = ipfsAddress.cid.toString()
        
        const agent = this.#agent
        const expression = agent.createSignedExpression({name, description})
        expression.data = Buffer.from(JSON.stringify(expression.data))
        await this.#holochain.call(DNA_NICK, "anchored-expression", "store_expression", {
            key: hash,
            expression
        })
        
        return hash as Address
    }
}