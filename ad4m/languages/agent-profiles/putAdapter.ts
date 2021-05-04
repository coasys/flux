import type Address from "@perspect3vism/ad4m/Address";
import type Agent from "@perspect3vism/ad4m/Agent";
import type { ReadOnlyLanguage } from "@perspect3vism/ad4m/Language";

export default class AgentPutAdapter implements ReadOnlyLanguage {
  async addressOf(agent: object): Promise<Address> {
    return (agent as Agent).did;
  }
}
