import type Address from "ad4m/Address";
import type Agent from "ad4m/Agent";
import type { ReadOnlyLanguage } from "ad4m/Language";

export default class AgentPutAdapter implements ReadOnlyLanguage {
    async addressOf(agent: object): Promise<Address> {
        return (agent as Agent).did
    }
}