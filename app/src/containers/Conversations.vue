<template>
  <div class="wrapper">
    <j-text nomargin>Explore and manage conversations here!</j-text>

    <j-flex a="center" gap="500">
      <j-button
        variant="primary"
        @click="() => startNewConversation(parentChannel.id)"
        :loading="newConversationLoading"
        :disabled="newConversationLoading"
      >
        <j-icon name="door-open" />
        Start conversation in channel
      </j-button>
    </j-flex>

    <j-box mt="400">
      <j-flex direction="column" gap="400" class="conversations">
        <div
          class="conversation-wrapper"
          v-for="conversation in conversations.slice(0, numberOfConversationsDisplayed)"
          :key="conversation.id"
        >
          <div class="fades">
            <div class="fade-top" />
            <div class="fade-bottom" />
            <div class="line" />
          </div>

          <j-flex class="controls" gap="300">
            <j-button size="sm" variant="subtle" @click="() => navigateToConversation(conversation.channelId)">
              <j-icon name="door-open" size="sm" />
              Open
            </j-button>

            <j-button
              size="sm"
              variant="subtle"
              @click="() => moveConversation(conversation.channelId, 'ad4m://self', conversation.name)"
            >
              <j-icon name="x-lg" size="sm" />
              Remove
            </j-button>
          </j-flex>

          <TimelineBlock
            block-type="conversation"
            :data="conversation"
            :timeline-index="0"
            selected-topic-id=""
            zoom="Conversations"
            location="channel-conversations"
          />
        </div>

        <j-button
          v-if="conversations.length > numberOfConversationsDisplayed"
          class="show-more-button"
          @click="() => (numberOfConversationsDisplayed = numberOfConversationsDisplayed + 5)"
        >
          See more
          <span> <ChevronDownIcon /> {{ conversations.length - numberOfConversationsDisplayed }} </span>
        </j-button>
      </j-flex>
    </j-box>
  </div>
</template>

<script setup lang="ts">
import TimelineBlock from '@/components/conversation/timeline/TimelineBlock.vue';
import { ChevronDownIcon } from '@/components/icons';
import { useCommunityService } from '@/composables/useCommunityService';
import { Channel } from '@coasys/flux-api';
import { SynergyGroup } from '@coasys/flux-utils';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface Props {
  parentChannel: Channel;
}

const props = defineProps<Props>();
const route = useRoute();
const router = useRouter();

const { perspective, newConversationLoading, startNewConversation, moveConversation, channelsWithConversations } =
  useCommunityService();

const numberOfConversationsDisplayed = ref(5);

// Derive conversations from the already-computed channelsWithConversations in useCommunityService
const conversations = computed((): (SynergyGroup & { channelId: string })[] => {
  const parentEntry = channelsWithConversations.value.find((c) => c.channel.id === props.parentChannel.id);
  if (!parentEntry?.children) return [];
  return parentEntry.children
    .filter((child) => child.conversation)
    .map((child) => ({
      id: child.conversation!.id,
      name: child.conversation!.conversationName,
      summary: child.conversation!.summary,
      timestamp: child.conversation!.createdAt,
      channelId: child.channel.id,
    })) as (SynergyGroup & { channelId: string })[];
});

function navigateToConversation(channelId: string) {
  router.push({
    name: 'view',
    params: { communityId: route.params.communityId, channelId, viewId: 'conversation' },
  });
}
</script>

<style lang="scss" scoped>
$line-offset: 92px;

.wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: var(--j-space-600);
  gap: var(--j-space-500);

  .conversations {
    height: 100%;
    overflow-y: scroll;

    &::-webkit-scrollbar {
      display: none;
    }

    .conversation-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      border: 1px solid var(--j-color-ui-300);
      border-radius: var(--j-border-radius);
      padding: 20px;
      gap: 15px;
      word-break: break-word;
      max-width: 1200px;

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

      .controls {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;

        // j-button {
        //   all: unset;
        //   cursor: pointer;
        //   display: flex;
        //   align-items: center;
        //   color: var(--j-color-ui-300);
        //   font-weight: 600;
        //   font-size: var(--j-font-size-400);

        //   > svg {
        //     width: 16px;
        //     height: 16px;
        //     margin-right: 6px;
        //   }
        // }
      }

      .conversation {
        height: 100%;
        z-index: 5;
        padding: 40px 0 10px 60px;

        // &.hidden {
        //   opacity: 0;
        //   height: 0;
        //   padding: 0;
        // }

        // .conversation-timestamp {
        //   left: 0px;
        // }

        .line {
          height: 50px;
          width: 6px;
          margin-left: $line-offset;
          background-color: var(--j-color-primary-200);
        }
      }
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
