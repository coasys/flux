import type Address from 'ad4m/Address'
import type Expression from 'ad4m/Expression'
import type { ExpressionAdapter, PublicSharing } from 'ad4m/Language'
import type LanguageContext from 'ad4m/LanguageContext'
import type { default as HolochainLanguageDelegate } from "language-context/lib/Holochain/HolochainLanguageDelegate"
import type AgentService from "ad4m/AgentService"
import { DNA_NICK } from './dna'

const _appendBuffer = (buffer1, buffer2) => {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
    return chunks.reduce(_appendBuffer)
}

class SharedPerspectivePutAdapter implements PublicSharing {
    #agent: AgentService
    #hcDna: HolochainLanguageDelegate

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        this.#hcDna = context.Holochain as HolochainLanguageDelegate
    }

    async createPublic(shortForm: object): Promise<Address> {
        //@ts-ignore
        let obj = JSON.parse(shortForm)
        const expression = this.#agent.createSignedExpression(obj.sharedPerspective)
        const reqData = {key: obj.key, sharedPerspective: expression}

        await this.#hcDna.call(DNA_NICK, "shared_perspective_index", "index_shared_perspective", reqData);
        return reqData.key;
    }
}

export default class Adapter implements ExpressionAdapter {
    #hcDna: HolochainLanguageDelegate

    putAdapter: PublicSharing

    constructor(context: LanguageContext) {
        this.#hcDna = context.Holochain as HolochainLanguageDelegate
        this.putAdapter = new SharedPerspectivePutAdapter(context)
    }

    async get(address: Address): Promise<void | Expression> {
        const cid = address.toString()
        //TODO: right now we are just returning the latest shared perspective under a given index but we actually will want to return
        //all sharedperspectives. This might mean changing the way expression signing works or just ignoring expression signing for the interim.
        let res = await this.#hcDna.call(DNA_NICK, "shared_perspective_index", "get_latest_shared_perspective", cid);
        if (res != null) {
            let expr: Expression = Object.assign(res.expression_data)
            return expr
        } else {
            return null
        }
    }
}