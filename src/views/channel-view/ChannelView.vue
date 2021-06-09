<template>
  <div class="channel-view">
    <header class="channel-view__header">
      <j-icon size="sm" name="hash" />
      <j-text nomargin weight="500" size="500">{{ channel.name }}</j-text>
    </header>
    <div class="channel-view__main">
      <dynamic-scroller
        :items="messageList"
        :min-item-size="100"
        class="channelView__messages"
        ref="messagesContainer"
      >
        <template v-slot="{ item, index, active }">
          <dynamic-scroller-item
            :item="item"
            :active="active"
            :data-index="index"
          >
            <j-message-item
              :hideuser="item.hideUser"
              :timestamp="item.timestamp"
            >
              <j-avatar
                :src="require('@/assets/images/junto_app_icon.png')"
                slot="avatar"
                initials="P"
              />
              <span slot="username">Username</span>
              <div slot="message">
                <span v-html="item.message"></span>
              </div>
            </j-message-item>
          </dynamic-scroller-item>
        </template>
      </dynamic-scroller>
    </div>
    <footer class="channel-view__footer">
      <j-editor
        @keydown.enter="
          (e) =>
            !e.shiftKey &&
            createDirectMessage({ body: e.target.value, background: [''] })
        "
        :value="currentExpressionPost"
        @change="(e) => (currentExpressionPost = e.target.value)"
      ></j-editor>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import { JuntoShortForm } from "@/core/juntoTypes";
import Expression from "@perspect3vism/ad4m/Expression";
import { ChannelState, CommunityState } from "@/store";
import { getLinksPaginated } from "@/core/queries/getLinks";
import { createExpression } from "@/core/mutations/createExpression";
import { createLink } from "@/core/mutations/createLink";

interface ChatItem {
  id: string;
  date?: Date | string | number;
  message?: Expression;
  hideUser?: boolean;
}

export default defineComponent({
  setup() {
    const currentExpressionPost = ref({});

    return {
      currentExpressionPost,
    };
  },
  mounted() {
    console.log("Current mounted channel", this.channel);
    this.scrollToBottom();
    this.getNextSetExpressions();
  },
  computed: {
    community(): CommunityState {
      const { communityId } = this.$route.params;
      return this.$store.getters.getCommunity(communityId);
    },
    channel(): ChannelState {
      const { channelId, communityId } = this.$route.params;
      return this.$store.getters.getChannel({ channelId, communityId });
    },
    messageList(): Array<ChatItem> {
      return this.channel.currentExpressionMessages.reduce(
        (acc: any, item: any, index: number) => {
          const previousItem = acc[index - 1];
          return [
            ...acc,
            {
              id: item.expression.timestamp,
              authorId: item.expression.author.did,
              timestamp: item.expression.timestamp,
              message: JSON.parse(item.expression.data).body,
              hideUser: item.expression.author.did === previousItem?.authorId,
            },
          ];
        },
        []
      );
    },
  },
  methods: {
    async getNextSetExpressions(lastSeen?: Date) {
      //NOTE: here we could add logic which updates a channels state detailing how far back we have gone with manual queries
      //This could be useful for limiting redundant zome calls that have already been made
      //But we might actually want to remake these zome calls since holochain is eventually consistent and previous zome calls may not have
      //returned all expressions
      let fromDate;
      if (lastSeen == undefined) {
        //Get from application start time -> channel creation time in chunks
        //Dedup results from whats already in the store and add deduped values to the store
        fromDate = this.$store.getters.getApplicationStartTime;
      } else {
        //Get from lastSeen -> channel creationg time in chunks
        fromDate = lastSeen;
      }
      console.log("Query from", fromDate, "until", this.channel?.createdAt);
      let links = await getLinksPaginated(
        this.$route.params.channelId.toString(),
        "sioc://chatchannel",
        "sioc://content_of",
        fromDate,
        this.channel?.createdAt
      );
      console.log("Got paginated links", links);
      this.$store.commit("addMessagesIfNotPresent", {
        channelId: this.channel!.perspective,
        links: links,
      });
    },
    async createDirectMessage(message: JuntoShortForm) {
      console.log({ message });
      let shortFormExpressionLanguage = this.community.expressionLanguages[0]!;
      console.log(
        new Date().toISOString(),
        "Posting shortForm expression to language",
        shortFormExpressionLanguage
      );

      let exprUrl = await createExpression(
        shortFormExpressionLanguage,
        JSON.stringify(message)
      );
      console.log("Created expression with hash", exprUrl);
      let addLink = await createLink(this.$route.params.channelId.toString(), {
        source: "sioc://chatchannel",
        target: exprUrl,
        predicate: "sioc://content_of",
      });
      console.log("Adding link with response", addLink);
      setTimeout(this.scrollToBottom, 300);
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      //@ts-ignore
      container.scrollTop = container.scrollHeight;
    },
  },

  components: {
    DynamicScroller,
    DynamicScrollerItem,
  },
});
</script>

<style scoped>
.channel-view {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.channel-view__header {
  position: sticky;
  top: 0;
  height: 40px;
  padding: var(--j-space-500);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--j-color-ui-100);
  background: var(--j-color-white);
  z-index: 1;
}
.channel-view__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.channel-view__footer {
  background: var(--j-color-white);
  position: sticky;
  bottom: 0;
  padding: var(--j-space-300);
}
</style>
