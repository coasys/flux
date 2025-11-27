<template>
  <j-tooltip placement="top" title="Set agent status">
    <j-popover
      :open="showAgentStatusMenu"
      @toggle="(e: any) => (showAgentStatusMenu = e.target.open)"
      event="click"
      placement="top-end"
      style="cursor: pointer; margin-top: 2px"
    >
      <j-flex slot="trigger" a="center" gap="100">
        <div class="agent-status" :class="myAgentStatus" />
        <j-text nomargin size="300">{{ myAgentStatus }}</j-text>
      </j-flex>

      <j-menu slot="content">
        <j-menu-item v-for="status in statusStates" :key="status" @click="setAgentStatus(status)">
          <div slot="start" class="agent-status" :class="status" />
          {{ status }}
        </j-menu-item>
      </j-menu>
    </j-popover>
  </j-tooltip>
</template>

<script setup lang="ts">
import { useWebrtcStore } from '@/stores';
import { AgentStatus } from '@coasys/flux-types';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const webrtcStore = useWebrtcStore();
const { myAgentStatus } = storeToRefs(webrtcStore);

const showAgentStatusMenu = ref(false);
const statusStates: AgentStatus[] = ['active', 'asleep', 'busy', 'invisible'];

function setAgentStatus(status: AgentStatus) {
  myAgentStatus.value = status;
  showAgentStatusMenu.value = false;
}
</script>

<style scoped lang="scss">
.agent-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--j-color-ui-200);

  &.active {
    background-color: var(--j-color-success-500);
  }

  &.asleep {
    background-color: var(--j-color-warning-500);
  }

  &.busy {
    background-color: var(--j-color-danger-500);
  }

  &.invisible {
    border: 1px solid var(--j-color-ui-400);
  }
}
</style>
