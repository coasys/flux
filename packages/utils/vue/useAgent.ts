import { ref, watch } from "vue";
import { Agent, AgentStatus } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";

const status = ref<AgentStatus>({ isInitialized: false, isUnlocked: false });
const agent = ref<Agent | undefined>();
const isListening = ref(false);

export function useAgent(client: AgentClient) {
  watch(
    () => client,
    async () => {
      if (!isListening.value) {
        status.value = await client.status();
        agent.value = await client.me();

        console.log({ status, agent });

        isListening.value = true;

        client.addAgentStatusChangedListener(async (s: AgentStatus) => {
          status.value = s;
        });

        client.addUpdatedListener(async (a: Agent) => {
          agent.value = a;
        });
      }
    },
    { immediate: true }
  );

  return { status, agent };
}
