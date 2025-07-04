<template>
  <div :id="`timeline-block-${baseExpression}`" :class="['timeline-block', blockType]">
    <button v-if="!match" class="group-button" @click="onGroupClick" />

    <!-- Timestamps -->
    <j-timestamp v-if="blockType === 'conversation'" :value="timestamp" relative class="timestamp" />
    <span v-else-if="blockType === 'subgroup'" class="timestamp">
      {{ ((new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60).toFixed(1) }} mins
    </span>
    <j-timestamp v-else-if="blockType === 'item'" :value="timestamp" time-style="short" class="timestamp" />

    <!-- Position indicator -->
    <div class="position">
      <div v-if="!showChildren" :class="['node', { selected }]" />
      <div class="line" />
    </div>

    <!-- Content for conversations and subgroups -->
    <j-flex v-if="['conversation', 'subgroup'].includes(blockType)" direction="column" gap="300" class="content">
      <j-flex direction="column" gap="300" :class="['card', { selected }]">
        <j-flex a="center" gap="400">
          <j-flex a="center" gap="400">
            <PercentageRing
              v-if="match && match.baseExpression === baseExpression"
              :ring-size="70"
              :font-size="10"
              :score="(match.score || 0) * 100"
            />
            <h1>{{ name }}</h1>
          </j-flex>

          <button v-if="totalChildren > 0" class="show-children-button" @click="setShowChildren(!showChildren)">
            <ChevronDown v-if="showChildren" />
            <ChevronRight v-else />
            {{ totalChildren }}
          </button>
        </j-flex>

        <p class="summary">{{ summary }}</p>

        <j-flex class="participants">
          <Avatar
            v-for="(participant, i) in participants"
            :key="participant"
            :did="participant"
            :style="{ marginLeft: i > 0 ? '-10px' : '0' }"
          />
        </j-flex>

        <j-flex v-if="selected" gap="300" wrap style="margin-top: 5px">
          <button
            v-for="topic in topics"
            :key="topic.baseExpression"
            :class="['tag', { focus: selectedTopicId === topic.baseExpression }]"
            @click="search!('topic', baseExpression, topic)"
            :disabled="!!match"
            :style="{ cursor: !!match ? 'default' : 'pointer' }"
          >
            #{{ topic.name }}
          </button>

          <button v-if="!match" :class="['tag', 'vector']" @click="search!('vector', baseExpression)">
            <j-icon name="flower2" color="color-success-500" size="sm" style="margin-right: 5px" />
            Synergize
          </button>
        </j-flex>
      </j-flex>

      <!-- Children -->
      <div v-if="totalChildren > 0 && showChildren" class="children">
        <!-- Expand button before -->
        <template v-if="onMatchTree && collapseBefore && matchIndex! > 0">
          <div class="expand-button-wrapper" style="margin-top: 6px">
            <div class="expand-button">
              <j-button @click="setCollapseBefore(false)">
                See more
                <span> <ChevronUp /> {{ matchIndex }} </span>
              </j-button>
            </div>
          </div>
          <div class="expand-button-padding" />
        </template>

        <div class="curve-top">
          <SubwayTimelineCurve />
        </div>

        <!-- Recursive timeline blocks -->
        <TimelineBlock
          v-for="(child, index) in visibleChildren"
          :key="child.baseExpression"
          :block-type="blockType === 'conversation' ? 'subgroup' : 'item'"
          :last-child="index === visibleChildren.length - 1"
          :data="child"
          :timeline-index="timelineIndex"
          :match="match"
          :match-indexes="matchIndexes"
          :set-match-indexes="setMatchIndexes"
          :zoom="zoom"
          :refresh-trigger="refreshTrigger"
          :selected-topic-id="selectedTopicId"
          :selected-item-id="selectedItemId"
          :set-selected-item-id="setSelectedItemId"
          :search="search"
          :set-loading="setLoading"
          :loading="loading"
        />

        <div class="curve-bottom">
          <SubwayTimelineCurve />
        </div>

        <!-- Expand button after -->
        <div
          v-if="onMatchTree && collapseAfter && matchIndex! < children.length - 1"
          class="expand-button-wrapper"
          :style="{ marginTop: blockType === 'subgroup' ? '-8px' : '-20px' }"
        >
          <div class="expand-button">
            <j-button @click="setCollapseAfter(false)">
              See more
              <span> <ChevronDown /> {{ children.length - matchIndex! - 1 }} </span>
            </j-button>
          </div>
        </div>
      </div>
    </j-flex>

    <!-- Content for items -->
    <j-flex v-else-if="blockType === 'item'" gap="400" a="center" :class="['item-card', { selected }]">
      <PercentageRing
        v-if="match && match.baseExpression === baseExpression"
        :ring-size="70"
        :font-size="10"
        :score="(match.score || 0) * 100"
      />

      <j-flex gap="300" direction="column">
        <j-flex gap="400" a="center">
          <j-icon :name="data.icon" color="ui-400" size="lg" />
          <j-flex gap="400" a="center" wrap>
            <Avatar :did="author" show-name />
          </j-flex>
        </j-flex>

        <j-text nomargin :dangerously-set-inner-html="{ __html: data.text }" class="item-text" color="color-white" />

        <j-flex v-if="selected" gap="300" wrap style="margin-top: 10px">
          <button v-if="!match" :class="['tag', 'vector']" @click="search!('vector', baseExpression)">
            <j-icon name="flower2" color="color-success-500" size="sm" style="margin-right: 5px" />
            Synergize
          </button>
        </j-flex>
      </j-flex>
    </j-flex>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronRight, ChevronUp, SubwayTimelineCurve } from "@/components/icons/index";
import Avatar from "@/components/synergy/avatar/Avatar.vue";
import PercentageRing from "@/components/synergy/percentage-ring/PercentageRing.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import { LinkQuery } from "@coasys/ad4m";
import { Conversation, ConversationSubgroup } from "@coasys/flux-api";
import {
  BlockType,
  GroupingOption,
  MatchIndexes,
  SearchType,
  SynergyGroup,
  SynergyItem,
  SynergyMatch,
  SynergyTopic,
} from "@coasys/flux-utils";
import { computed, ref, watch } from "vue";

interface Props {
  blockType: BlockType;
  lastChild?: boolean;
  data: any;
  timelineIndex: number;
  selectedTopicId: string;
  match?: SynergyMatch;
  matchIndexes?: MatchIndexes;
  setMatchIndexes?: (indexes: MatchIndexes) => void;
  zoom?: GroupingOption;
  refreshTrigger?: number;
  selectedItemId?: string;
  setSelectedItemId?: (id: string | null) => void;
  search?: (type: SearchType, itemId: string, topic?: SynergyTopic) => void;
  setLoading?: (loading: boolean) => void;
  loading?: boolean;
}

const props = defineProps<Props>();
const { baseExpression, name, summary, timestamp, start, end, author, index, parentIndex } = props.data;

const { perspective } = useCommunityService();

const totalChildren = ref(0);
const participants = ref<string[]>([]);
const topics = ref<SynergyTopic[]>([]);
const children = ref<SynergyGroup[] | SynergyItem[]>([]);
const showChildren = ref(false);
const selected = ref(false);
const collapseBefore = ref(true);
const collapseAfter = ref(true);
const firstLoad = ref(true);

const matchIndex = computed(() =>
  props.match
    ? props.blockType === "conversation"
      ? props.matchIndexes?.subgroup
      : props.matchIndexes?.item
    : undefined
);

const onMatchTree = computed(() =>
  props.match
    ? (props.blockType === "conversation" && index === props.matchIndexes?.conversation) ||
      (props.blockType === "subgroup" &&
        parentIndex === props.matchIndexes?.conversation &&
        index === props.matchIndexes?.subgroup)
    : false
);

const visibleChildren = computed(() =>
  children.value.filter((child: any, i) => {
    child.parentIndex = index;
    child.index = i;
    if (onMatchTree.value) {
      // skip if below match
      if (props.zoom === "Conversations") return true;
      if (props.zoom === "Subgroups" && props.blockType === "subgroup") return true;
      // skip if collapsed
      if (collapseBefore.value && collapseAfter.value) return i === matchIndex.value;
      else if (collapseBefore.value) return i >= matchIndex.value!;
      else if (collapseAfter.value) return i <= matchIndex.value!;
    }
    return true;
  })
);

async function getConversationStats() {
  const conversation = new Conversation(perspective, baseExpression);
  const stats = await conversation.stats();
  totalChildren.value = stats.totalSubgroups;
  participants.value = stats.participants;
}

async function getSubgroupStats() {
  const subgroup = new ConversationSubgroup(perspective, baseExpression);
  const stats = await subgroup.stats();
  totalChildren.value = stats.totalItems;
  participants.value = stats.participants;
}

async function getConversationTopics() {
  const conversation = new Conversation(perspective, baseExpression);
  topics.value = await conversation.topics();
}

async function getSubgroupTopics() {
  const subgroup = new ConversationSubgroup(perspective, baseExpression);
  topics.value = await subgroup.topics();
}

async function getSubgroups() {
  const conversation = new Conversation(perspective, baseExpression);
  const subgroups = await conversation.subgroupsData();

  if (props.match) {
    // Look for match in subgroups
    subgroups.forEach((subgroup, subgroupIndex) => {
      if (subgroup.baseExpression === props.match!.baseExpression) {
        // If found, store the subgroups index & mark loading true to prevent further loading
        props.setMatchIndexes?.({
          conversation: index,
          subgroup: subgroupIndex,
          item: undefined,
        });
        props.setLoading?.(false);
      }
    });
  }
  children.value = subgroups;
}

async function removeDuplicateItems(itemIds: string[]) {
  // Used to remove duplicate items from the subgroup if added multiple times due to network errors
  console.log("Removing duplicate items from subgroup", itemIds);
  const duplicateLinks = await Promise.all(
    itemIds.map(async (itemId) => {
      // Grab all links connecting the item to the subgroup
      const links = await perspective.get(
        new LinkQuery({ source: baseExpression, predicate: "ad4m://has_child", target: itemId })
      );
      // Remove all except the first link
      return links.slice(1);
    })
  );
  await perspective.removeLinks(duplicateLinks.flat());
}

async function getItems() {
  const subgroup = new ConversationSubgroup(perspective, baseExpression);
  const items = await subgroup.itemsData();
  const uniqueItems = new Map();
  const duplicates = new Set<string>();

  items.forEach((item, itemIndex) => {
    // Store duplicates for link cleanup
    if (uniqueItems.has(item.baseExpression)) {
      duplicates.add(item.baseExpression);
    } else {
      uniqueItems.set(item.baseExpression, item);
      // Set match indexes and stop loading if match found
      if (props.match && item.baseExpression === props.match.baseExpression) {
        props.setMatchIndexes?.({
          conversation: parentIndex,
          subgroup: index,
          item: itemIndex,
        });
        props.setLoading?.(false);
      }
    }
  });

  children.value = Array.from(uniqueItems.values());

  // Remove duplicates if found
  const duplicateItems = Array.from(duplicates);
  if (duplicateItems.length) {
    await removeDuplicateItems(duplicateItems);
  }
}

function onGroupClick() {
  if (!props.match) {
    props.setSelectedItemId?.(selected.value ? null : baseExpression);
  }
  if (!selected.value) {
    if (props.blockType === "conversation") getConversationTopics();
    if (props.blockType === "subgroup") getSubgroupTopics();
  }
}

function setShowChildren(value: boolean) {
  showChildren.value = value;
}

function setCollapseBefore(value: boolean) {
  collapseBefore.value = value;
}

function setCollapseAfter(value: boolean) {
  collapseAfter.value = value;
}

// Get stats on first load and whenever refresh triggered if last child
watch(
  () => props.refreshTrigger,
  () => {
    if (firstLoad.value || props.lastChild) {
      firstLoad.value = false;
      if (props.blockType === "conversation") getConversationStats();
      if (props.blockType === "subgroup") getSubgroupStats();
    }
  },
  { immediate: true }
);

// Get data when expanding children or refresh triggered & children expanded
watch([() => showChildren.value, () => props.refreshTrigger], () => {
  // false on first load. updated when zoom useEffect below fires and later when children are expanded by user
  if (showChildren.value) {
    if (props.blockType === "conversation") getSubgroups();
    if (props.blockType === "subgroup") getItems();
    // deselects block when clicked on if not a match and not the currently selected item
    if (!props.match && props.selectedItemId !== baseExpression) {
      props.setSelectedItemId?.(null);
    }
  }
});

// Expand or collapse children based on zoom level
watch(
  () => props.zoom,
  () => {
    // if a match and loading has finished at the level above, stop further expansion
    if (!props.match || props.loading) {
      if (props.zoom === "Conversations") {
        showChildren.value = false;
      } else if (props.zoom === "Subgroups") {
        showChildren.value = props.blockType === "conversation";
      } else {
        showChildren.value = true;
      }
    }
  }
);

// Mark as selected & get topics if match
watch(
  () => props.selectedItemId,
  () => {
    const isSelected = props.selectedItemId === baseExpression;
    const isMatch = props.match?.baseExpression === baseExpression;
    selected.value = isSelected || isMatch;

    if (isMatch) {
      if (props.blockType === "conversation") getConversationTopics();
      if (props.blockType === "subgroup") getSubgroupTopics();
    }
  },
  { immediate: true }
);

// Scroll to matching item
watch(
  () => props.selectedItemId,
  () => {
    if (props.selectedItemId) {
      const item = document.getElementById(`timeline-block-${props.selectedItemId}`);
      const timeline = document.getElementById(`timeline-${props.timelineIndex}`);

      if (item && timeline) {
        timeline.scrollBy({
          top: item.getBoundingClientRect().top - 550,
          behavior: "smooth",
        });
      }
    }
  }
);
</script>

<style scoped lang="scss">
$line-offset: 92px;

.wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 320px);

  .header {
    flex-shrink: 0;
    z-index: 15;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    flex-basis: 100%;
    height: 100%;
    position: relative;

    .fades {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;

      .fadeTop {
        position: absolute;
        top: 0;
        height: 100px;
        width: 100%;
        background: linear-gradient(to bottom, var(--app-channel-bg-color), transparent);
        z-index: 10;
      }

      .fadeBottom {
        position: absolute;
        bottom: 0;
        height: 100px;
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

    .items {
      height: 100%;
      overflow-y: scroll;
      z-index: 5;
      padding: 130px 20px 130px 60px;

      &::-webkit-scrollbar {
        display: none;
      }

      .line {
        height: 130px;
        width: 6px;
        margin-left: $line-offset;
        background-color: var(--j-color-primary-200);
      }

      .itemCard {
        display: flex;
        margin-bottom: 20px;
        width: 100%;
        border: 1px solid var(--j-color-ui-300);
        border-radius: var(--j-border-radius);
        padding: var(--j-space-400);
        background-color: var(--j-color-ui-100);

        .timestamp {
          font-size: 14px;
          color: var(--j-color-ui-400);
        }
      }

      .itemText {
        p {
          margin: 0;
        }
      }

      .progress {
        position: relative;
        width: 100%;
        height: 24px;
        margin-top: var(--j-space-400);
        border-radius: 12px;
        background-color: var(--j-color-ui-100);
        box-shadow: 0 0 0 1px var(--j-color-ui-300);

        .progressBar {
          height: 24px;
          border-radius: 12px;
          background-color: var(--j-color-primary-300);
          transition: width 0.3s ease-in-out;
        }

        .progressText {
          position: absolute;
          top: 2.5px;
          left: 10px;
        }
      }
    }
  }
}
</style>
