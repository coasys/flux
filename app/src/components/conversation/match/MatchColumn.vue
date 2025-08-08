<template>
  <div class="match-column-wrapper">
    <j-flex direction="column" gap="400" class="header">
      <j-flex a="center" gap="400" wrap>
        <j-menu style="height: 42px; z-index: 20">
          <j-menu-group collapsible :title="filterSettings.grouping" id="grouping-menu">
            <j-menu-item
              v-for="option in filteredGroupingOptions"
              :key="option"
              :selected="filterSettings.grouping === option"
              @click="
                () => {
                  setFilterSettings({ ...filterSettings, grouping: option });
                  closeMenu('grouping-menu');
                }
              "
            >
              {{ option }}
            </j-menu-item>
          </j-menu-group>
        </j-menu>

        <j-menu v-if="filterSettings.grouping === 'Items'" style="height: 42px; z-index: 20">
          <j-menu-group collapsible :title="filterSettings.itemType" id="item-type-menu">
            <j-menu-item
              v-for="option in itemTypeOptions"
              :key="option"
              :selected="filterSettings.itemType === option"
              @click="
                () => {
                  setFilterSettings({ ...filterSettings, itemType: option });
                  closeMenu('item-type-menu');
                }
              "
            >
              {{ option }}
            </j-menu-item>
          </j-menu-group>
        </j-menu>

        <j-checkbox
          :checked="filterSettings.includeChannel"
          @change="() => setFilterSettings({ ...filterSettings, includeChannel: !filterSettings.includeChannel })"
        >
          Include Channel
        </j-checkbox>

        <button class="close-button" @click="close">
          <j-icon name="x" color="color-white" />
        </button>
      </j-flex>

      <h2>{{ matchText }}</h2>
    </j-flex>

    <j-flex direction="column" gap="400" class="results">
      <Match
        v-for="(match, index) in visibleMatches"
        :key="index"
        :match="match"
        :index="index"
        :grouping="filterSettings.grouping"
        :selected-topic-id="selectedTopicId"
      />

      <j-button
        v-if="matches.length > numberOfMatchesDisplayed"
        class="show-more-button"
        @click="() => (numberOfMatchesDisplayed += 5)"
      >
        See more
        <span> <ChevronDownIcon /> {{ matches.length - numberOfMatchesDisplayed }} </span>
      </j-button>
    </j-flex>
  </div>
</template>

<script setup lang="ts">
import Match from "@/components/conversation/match/Match.vue";
import { ChevronDownIcon } from "@/components/icons";
import { closeMenu } from "@/utils/helperFunctions";
import {
  FilterSettings,
  GroupingOption,
  groupingOptions,
  itemTypeOptions,
  SearchType,
  SynergyMatch,
} from "@coasys/flux-utils";
import { computed, ref, watch } from "vue";

interface Props {
  matches: SynergyMatch[];
  selectedTopicId: string;
  searchType: SearchType;
  filterSettings: FilterSettings;
  setFilterSettings: (newSettings: FilterSettings) => void;
  matchText: string;
  close: () => void;
}

const props = defineProps<Props>();

const numberOfMatchesDisplayed = ref(5);

const filteredGroupingOptions = computed((): GroupingOption[] =>
  props.searchType === "topic" ? (["Conversations", "Subgroups"] as GroupingOption[]) : [...groupingOptions]
);

const visibleMatches = computed(() => props.matches.slice(0, numberOfMatchesDisplayed.value));

watch(
  () => props.matches,
  () => {
    numberOfMatchesDisplayed.value = 5;
  }
);
</script>

<style lang="scss" scoped>
.match-column-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: calc(100vh - 320px);

  .close-button {
    all: unset;
    cursor: pointer;
    position: absolute;
    top: 5px;
    right: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background-color: var(--j-color-ui-200);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 5;
  }

  .results {
    height: 100%;
    overflow-y: scroll;

    &::-webkit-scrollbar {
      display: none;
    }

    .show-more-button {
      margin-top: 30px;

      :deep(span) {
        color: var(--j-color-ui-300);
        display: flex;
        align-items: center;

        svg {
          width: 18px;
          height: 18px;
          margin-right: 8px;
        }
      }
    }
  }
}
</style>
