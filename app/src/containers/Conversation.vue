<template>
  <div class="synergy-wrapper">
    <j-flex gap="500" a="center" wrap>
      <j-flex v-if="aiStore" a="center" gap="300">
        <j-icon name="robot" color="ui-500" />
        <j-text nomargin>LLM processing:</j-text>
        <j-text nomargin weight="800">
          {{ defaultLLM ? (defaultLLM.local ? "Localy" : "Remotely") : "Disabled" }}
        </j-text>
        <j-icon :name="defaultLLM ? (defaultLLM.local ? 'house-fill' : 'broadcast-pin') : 'x-lg'" color="ui-500" />
        <j-icon
          name="info-circle"
          color="ui-500"
          @click="showLLMInfoModal = true"
          style="margin-left: 20px; cursor: pointer"
        />
      </j-flex>

      <!-- LLM Info Modal -->
      <j-modal :open="showLLMInfoModal" @toggle="(e: any) => (showLLMInfoModal = e.target.open)">
        <j-box v-if="aiStore" p="600" :key="modalRenderKey">
          <j-flex a="center" direction="column" gap="400">
            <j-icon name="robot" size="xl" color="ui-500" />
            <j-flex a="center" gap="400">
              <j-text uppercase nomargin color="primary-500" size="600"> LLM Settings </j-text>
              <j-icon
                name="arrow-repeat"
                @click="aiStore.loadAIData"
                :color="loadingAIData ? 'ui-300' : 'ui-500'"
                :style="{ cursor: loadingAIData ? 'auto' : 'pointer' }"
              />
            </j-flex>

            <j-box my="400">
              <j-text>
                Open the Ad4m launcher and navigate to the AI tab to view and/or edit your selected models
              </j-text>
            </j-box>

            <j-box my="400">
              <j-flex a="center" gap="300">
                <j-text nomargin>LLM processing:</j-text>
                <j-text nomargin weight="800">
                  {{ defaultLLM ? (defaultLLM.local ? "Localy" : "Remotely") : "Disabled" }}
                </j-text>
                <j-icon
                  :name="defaultLLM ? (defaultLLM.local ? 'house-fill' : 'broadcast-pin') : 'x-lg'"
                  color="ui-500"
                />
              </j-flex>
            </j-box>

            <j-box v-if="defaultLLM">
              <j-flex v-if="defaultLLM.local" a="center" direction="column" gap="400">
                <template v-if="llmLoadingStatus">
                  <j-flex a="center" gap="300">
                    <j-text weight="800" nomargin>Downloaded:</j-text>
                    <j-text nomargin>{{ llmLoadingStatus.downloaded }}</j-text>
                  </j-flex>
                  <j-flex a="center" gap="300">
                    <j-text weight="800" nomargin>Progress:</j-text>
                    <j-text nomargin>{{ llmLoadingStatus.progress }}%</j-text>
                  </j-flex>
                  <j-flex a="center" gap="300">
                    <j-text weight="800" nomargin>Status:</j-text>
                    <j-text nomargin>{{ llmLoadingStatus.status }}</j-text>
                  </j-flex>
                </template>
                <j-text v-else nomargin>No loading status available for local LLM</j-text>

                <j-flex a="center" gap="300">
                  <j-text weight="800" nomargin>Model Name:</j-text>
                  <j-text nomargin>{{ defaultLLM.name }}</j-text>
                </j-flex>
                <j-flex a="center" gap="300">
                  <j-text weight="800" nomargin>File Name:</j-text>
                  <j-text nomargin>{{ defaultLLM.local.fileName }}</j-text>
                </j-flex>
              </j-flex>

              <j-flex v-else-if="defaultLLM.api" a="center" direction="column" gap="400">
                <j-flex a="center" gap="300">
                  <j-text weight="800" nomargin>API Type:</j-text>
                  <j-text nomargin>{{ defaultLLM.api.apiType }}</j-text>
                </j-flex>
                <j-flex gap="300">
                  <j-text weight="800" nomargin>API Key:</j-text>
                  <j-text nomargin style="overflow: hidden; max-width: 600px; word-break: break-all">
                    {{ defaultLLM.api.apiKey }}
                  </j-text>
                </j-flex>
                <j-flex gap="300">
                  <j-text weight="800" nomargin>Base URL:</j-text>
                  <j-text nomargin>{{ defaultLLM.api.baseUrl }}</j-text>
                </j-flex>
                <j-flex gap="300">
                  <j-text weight="800" nomargin>Model:</j-text>
                  <j-text nomargin>{{ defaultLLM.api.model }}</j-text>
                </j-flex>
              </j-flex>
            </j-box>
          </j-flex>
        </j-box>
      </j-modal>
    </j-flex>

    <j-badge v-if="callHealth !== 'healthy'" variant="danger">
      <j-icon name="exclamation-triangle" style="margin-right: 10px" />
      Holochain signals disrupted. Processing paused until connection restored.
    </j-badge>

    <div class="synergy-content">
      <div
        :style="{
          width: showMatchColumn ? '50%' : '100%',
          maxWidth: '1200px',
          transition: 'width 0.5s ease-in-out',
          height: isMobile ? 'calc(100% - 70px)' : '100%',
        }"
      >
        <TimelineColumn :selected-topic-id="selectedTopic?.baseExpression || ''" :search="search" />
      </div>

      <div
        :style="{
          width: showMatchColumn ? '50%' : '0%',
          opacity: showMatchColumn ? '1' : '0',
          pointerEvents: showMatchColumn ? 'all' : 'none',
          transition: 'all 0.5s ease-in-out',
          maxWidth: '1200px',
          marginLeft: showMatchColumn ? '40px' : 0,
        }"
      >
        <MatchColumn
          :matches="matches"
          :selected-topic-id="selectedTopic?.baseExpression || ''"
          :search-type="searchType"
          :filter-settings="filterSettings"
          :set-filter-settings="setFilterSettings"
          :match-text="matchText"
          :close="() => (showMatchColumn = false)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MatchColumn from "@/components/conversation/match/MatchColumn.vue";
import TimelineColumn from "@/components/conversation/timeline/TimelineColumn.vue";
import { useCommunityService } from "@/composables/useCommunityService";
import { useAiStore, useUiStore, useWebrtcStore } from "@/stores";
import { SemanticRelationship, Topic } from "@coasys/flux-api";
import { FilterSettings, SearchType, SynergyMatch, SynergyTopic } from "@coasys/flux-utils";
import { cos_sim } from "@xenova/transformers";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const aiStore = useAiStore();
const webrtcStore = useWebrtcStore();
const uiStore = useUiStore();

const { perspective } = useCommunityService();
const { defaultLLM, llmLoadingStatus, loadingAIData } = storeToRefs(aiStore);
const { callHealth } = storeToRefs(webrtcStore);
const { isMobile } = storeToRefs(uiStore);

const MINIMUM_MATCH_SCORE = 0.2;

const matches = ref<SynergyMatch[]>([]);
const selectedTopic = ref<SynergyTopic | null>(null);
const searchItemId = ref("");
const searching = ref(false);
const searchType = ref<SearchType>("");
const filterSettings = ref<FilterSettings>({
  grouping: "Conversations",
  itemType: "All Types",
  includeChannel: false,
});
const showMatchColumn = ref(false);
const showLLMInfoModal = ref(false);
const modalRenderKey = ref(0);

async function findEmbeddingMatches(itemId: string): Promise<SynergyMatch[]> {
  // Searches for items in the neighbourhood that match the search filters & have similar embedding scores
  const semanticRelationship = new SemanticRelationship(perspective);
  const sourceEmbedding = await semanticRelationship.itemEmbedding(itemId);
  let allEmbeddings = [] as SynergyMatch[];
  const { grouping, itemType } = filterSettings.value;

  if (grouping === "Conversations") allEmbeddings = await semanticRelationship.allConversationEmbeddings();
  if (grouping === "Subgroups") allEmbeddings = await semanticRelationship.allSubgroupEmbeddings();
  if (grouping === "Items") {
    if (itemType === "All Types") allEmbeddings = await semanticRelationship.allItemEmbeddings();
    else allEmbeddings = await semanticRelationship.allItemEmbeddingsByType(itemType);
  }

  const matches = await Promise.all(
    allEmbeddings.map(async (e: any) => {
      const { baseExpression, type, embedding, channelId, channelName } = e;
      // Filter out results that don't match the search filters
      const isSourceItem = baseExpression === itemId;
      const wrongChannel = !filterSettings.value.includeChannel && channelId === route.params.channelId;
      if (isSourceItem || wrongChannel) return null;
      // Generate a similarity score for the embedding
      const score = await cos_sim(sourceEmbedding, embedding);
      return { baseExpression, channelId, channelName, type, score };
    })
  );
  return matches.filter((item) => item && item.score > MINIMUM_MATCH_SCORE) as SynergyMatch[];
}

async function findTopicMatches(itemId: string, topicId: string): Promise<SynergyMatch[]> {
  const { grouping } = filterSettings.value;
  // Todo: remove option for "Items" grouping so this isn't necessary
  // If the grouping is "Items", we need to change it to "Conversations" as topics no longer have topic tags
  let currentGrouping = grouping === "Items" ? "Conversations" : grouping;
  if (grouping === "Items") {
    filterSettings.value = { ...filterSettings.value, grouping: "Conversations" };
  }

  // Find matches
  const topic = new Topic(perspective, topicId);
  const topicMatches =
    currentGrouping === "Conversations" ? await topic.linkedConversations() : await topic.linkedSubgroups();

  // Filter out results that don't match the search filters
  const filteredMatches = topicMatches.map((relationship) => {
    const { baseExpression, type, channelId, channelName, relevance } = relationship;
    const isSourceItem = baseExpression === itemId;
    const wrongChannel = !filterSettings.value.includeChannel && channelId === route.params.channelId;
    if (isSourceItem || wrongChannel) return null;
    return { baseExpression, channelId, channelName, type, score: (relevance || 0) / 100 };
  });

  return filteredMatches.filter((i) => i !== null);
}

async function search(type: SearchType, itemId: string, topic?: SynergyTopic) {
  searching.value = true;
  matches.value = [];
  showMatchColumn.value = true;
  searchType.value = type;
  searchItemId.value = itemId;
  selectedTopic.value = type === "topic" && topic ? topic : null;

  try {
    const newMatches =
      type === "topic" ? await findTopicMatches(itemId, topic!.baseExpression) : await findEmbeddingMatches(itemId);

    const sortedMatches = newMatches
      .filter((match): match is SynergyMatch & { score: number } => typeof match.score === "number")
      .sort((a, b) => b.score - a.score);

    matches.value = sortedMatches;
  } catch (error) {
    console.error("Search failed:", error);
    matches.value = [];
  } finally {
    searching.value = false;
  }
}

const matchText = computed((): string => {
  if (!searchType.value) return "";
  if (searching.value) return "Searching for matches...";
  if (matches.value.length === 0) {
    return `No ${searchType.value} matches ${searchType.value === "topic" ? `for #${selectedTopic.value?.name}` : ""}`;
  }
  return `${matches.value.length} match${matches.value.length > 1 ? "es" : ""} ${searchType.value === "topic" ? `for #${selectedTopic.value?.name}` : ""}`;
});

function setFilterSettings(newSettings: FilterSettings) {
  filterSettings.value = newSettings;
}

// Update search results when filters change
watch(
  filterSettings,
  () => {
    if (searchItemId.value && searchType.value) {
      search(searchType.value, searchItemId.value, selectedTopic.value || undefined);
    }
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.synergy-wrapper {
  margin: 0 auto;
  padding: var(--j-space-800);
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media screen and (max-width: 800px) {
    padding: var(--j-space-400);
  }

  .synergy-content {
    display: flex;
    width: 100%;
    height: 100%;
    margin-top: 20px;
  }
}
</style>
