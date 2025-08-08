<template>
  <div class="match-wrapper">
    <div class="fades">
      <div class="fade-top" />
      <div class="fade-bottom" />
      <div class="line" />
    </div>

    <h2 class="channel-name">{{ channelName }}</h2>

    <div v-if="loading" class="loading-container">
      <j-flex gap="500" a="center">
        <j-text nomargin>Loading match...</j-text>
        <j-spinner size="xs" />
      </j-flex>
    </div>

    <div v-if="conversations.length > 0" :id="`timeline-${index + 1}`" :class="['items', { hidden: loading }]">
      <!-- Expand button before -->
      <div
        v-if="matchIndexes.conversation !== undefined && matchIndexes.conversation > 0 && collapseBefore"
        class="expand-button-wrapper"
        style="margin-bottom: 20px"
      >
        <div class="expand-button">
          <j-button @click="setCollapseBefore(false)">
            See more
            <span> <ChevronUpIcon /> {{ matchIndexes.conversation }} </span>
          </j-button>
        </div>
      </div>

      <!-- Timeline blocks -->
      <TimelineBlock
        v-for="conversation in visibleConversations"
        :key="conversation.baseExpression"
        block-type="conversation"
        :data="conversation"
        :timeline-index="index + 1"
        :zoom="grouping"
        :match="match"
        :match-indexes="matchIndexes"
        :set-match-indexes="setMatchIndexes"
        :selected-topic-id="selectedTopicId"
        :loading="loading"
        :set-loading="setLoading"
      />

      <!-- Expand button after -->
      <div
        v-if="
          matchIndexes.conversation !== undefined &&
          matchIndexes.conversation < conversations.length - 1 &&
          collapseAfter
        "
        class="expand-button-wrapper"
        style="margin-top: -20px"
      >
        <div class="expand-button">
          <j-button @click="setCollapseAfter(false)">
            See more
            <span> <ChevronDownIcon /> {{ conversations.length - matchIndexes.conversation - 1 }} </span>
          </j-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, ChevronUpIcon } from "@/components/icons";
import TimelineBlock from "@/components/synergy/timeline/TimelineBlock.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import { Channel } from "@coasys/flux-api";
import { GroupingOption, MatchIndexes, SynergyGroup, SynergyMatch } from "@coasys/flux-utils";
import { computed, onMounted, ref } from "vue";

interface Props {
  match: SynergyMatch;
  index: number;
  grouping: GroupingOption;
  selectedTopicId: string;
}

const props = defineProps<Props>();

const { perspective } = useCommunityService();

const loading = ref(true);
const conversations = ref<SynergyGroup[]>([]);
const matchIndexes = ref<MatchIndexes>({
  conversation: undefined,
  subgroup: undefined,
  item: undefined,
});
const collapseBefore = ref(true);
const collapseAfter = ref(true);

const channelId = computed(() => props.match.channelId);
const channelName = computed(() => props.match.channelName);
const visibleConversations = computed(() =>
  conversations.value.filter((conversation, i) => {
    conversation.index = i;
    if (matchIndexes.value.conversation !== undefined) {
      if (collapseBefore.value && collapseAfter.value) {
        return i === matchIndexes.value.conversation;
      } else if (collapseBefore.value) {
        return i >= matchIndexes.value.conversation;
      } else if (collapseAfter.value) {
        return i <= matchIndexes.value.conversation;
      }
    }
    return true;
  })
);

async function getData() {
  const channel = new Channel(perspective, channelId.value);
  const newConversations = await channel.conversations();

  // Find the conversation that contains the match
  newConversations.forEach((conversation, conversationIndex) => {
    if (conversation.baseExpression === props.match.baseExpression) {
      // Store the conversations index & mark loading false to prevent further loading of children
      matchIndexes.value = {
        ...matchIndexes.value,
        conversation: conversationIndex,
      };
      loading.value = false;
    }
  });

  conversations.value = newConversations;
}

function setMatchIndexes(indexes: MatchIndexes) {
  matchIndexes.value = indexes;
}

function setLoading(value: boolean) {
  loading.value = value;
}

function setCollapseBefore(value: boolean) {
  collapseBefore.value = value;
}

function setCollapseAfter(value: boolean) {
  collapseAfter.value = value;
}

onMounted(getData);
</script>

<style lang="scss" scoped>
$line-offset: 92px;

.match-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  border: 1px solid var(--j-color-ui-300);
  border-radius: var(--j-border-radius);
  padding: 20px;
  gap: 15px;
  word-break: break-word;

  .fades {
    position: absolute;
    width: calc(100% - 40px);
    height: 100%;
    pointer-events: none;
    top: 0;

    .fade-top {
      position: absolute;
      top: 0;
      height: 30px;
      width: 100%;
      background: linear-gradient(to bottom, var(--app-channel-bg-color), transparent);
      z-index: 10;
    }

    .fade-bottom {
      position: absolute;
      bottom: 0;
      height: 30px;
      width: 100%;
      background: linear-gradient(to top, var(--app-channel-bg-color), transparent);
      z-index: 10;
    }

    .line {
      height: 100%;
      width: 6px;
      margin-left: $line-offset;
      background-color: var(--j-color-primary-200);
    }
  }

  .channel-name {
    margin: 0px;
    position: absolute;
    z-index: 10;
  }

  .loading-container {
    margin-left: 130px;
    margin-bottom: -14px;
  }

  .items {
    height: 100%;
    z-index: 5;
    padding: 40px 0 10px 60px;

    &.hidden {
      opacity: 0;
      height: 0;
      padding: 0;
    }

    .line {
      height: 50px;
      width: 6px;
      margin-left: $line-offset;
      background-color: var(--j-color-primary-200);
    }

    .expand-button-wrapper {
      padding: 6px 0;
      background-color: var(--app-channel-bg-color);
      z-index: 5;
      display: flex;
      position: relative;

      .expand-button {
        margin-left: 32px;
        padding-left: 32px;
        height: 50px;
        display: flex;
        align-items: center;
        background-color: var(--app-channel-bg-color);
        border-left: 6px dotted var(--j-color-primary-200);

        :deep(j-button) {
          span {
            color: var(--j-color-ui-300);
            display: flex;

            svg {
              width: 20px;
              height: 20px;
              margin-right: 7px;
            }
          }
        }
      }
    }
  }
}
</style>
