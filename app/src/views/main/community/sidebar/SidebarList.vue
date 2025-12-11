<template>
  <j-box mt="800" mb="400" px="500">
    <j-flex direction="column" gap="400">
      <div class="header">
        <j-icon :name="icon" size="sm" color="ui-400" />

        <j-text color="ui-400" uppercase nomargin>{{ title }}</j-text>

        <j-box ml="200" mt="100" v-if="loading">
          <j-spinner size="xxs" />
        </j-box>

        <j-button
          v-if="title === 'Channels'"
          @click="() => (modalsStore.showCreateChannel = true)"
          size="sm"
          variant="ghost"
        >
          <j-icon size="sm" square name="plus" />
        </j-button>
      </div>

      <j-flex direction="column">
        <SidebarItem v-for="item in displayedItems" :key="item.channel.baseExpression" :item="item" />
      </j-flex>

      <button
        v-if="showExpandButton"
        class="show-more-button"
        :class="{ expanded: isExpanded }"
        @click="toggleExpanded"
      >
        <ChevronUpIcon v-if="isExpanded" />
        <ChevronDownIcon v-else />
        {{ isExpanded ? 'Show less' : `Show ${hiddenCount} more` }}
      </button>
    </j-flex>
  </j-box>
</template>

<script setup lang="ts">
import { ChevronDownIcon, ChevronUpIcon } from '@/components/icons';
import { ChannelData } from '@/composables/useCommunityService';
import { useModalStore } from '@/stores';
import SidebarItem from '@/views/main/community/sidebar/SidebarItem.vue';
import { computed, ref } from 'vue';

type Props = { title: string; icon: string; loading: boolean; items: ChannelData[]; limitTo?: number };
const { title, icon, loading, items, limitTo } = defineProps<Props>();

const modalsStore = useModalStore();

// Collapse functionality
const isExpanded = ref(false);

const showExpandButton = computed(() => limitTo && items.length > limitTo);
const hiddenCount = computed(() => (limitTo ? Math.max(0, items.length - limitTo) : 0));
const displayedItems = computed(() => {
  if (!limitTo || isExpanded.value || items.length <= limitTo) return items;
  return items.slice(0, limitTo);
});

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  height: 25px;
}

.show-more-button {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--j-color-ui-400);
  font-size: var(--j-font-size-400);
  margin-top: -6px;
  transition: color 0.3s ease;

  > svg {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    margin-bottom: 2px;
    color: var(--j-color-ui-300);
    transition: color 0.3s ease;
  }

  &.expanded > svg {
    margin-bottom: 0;
  }

  &:hover {
    color: var(--j-color-ui-500);
    svg {
      color: var(--j-color-ui-400);
    }
  }
}
</style>
