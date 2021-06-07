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
import { useRoute } from "vue-router";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import { JuntoShortForm } from "@/core/juntoTypes";
import {
  CREATE_EXPRESSION,
  ADD_LINK,
  QUERY_EXPRESSION,
} from "@/core/graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";
import { useLazyQuery, useMutation } from "@vue/apollo-composable";
import Expression from "@perspect3vism/ad4m/Expression";
import { ChannelState, CommunityState } from "@/store";

interface ChatItem {
  id: string;
  date?: Date | string | number;
  message?: Expression;
  hideUser?: boolean;
}

export default defineComponent({
  setup() {
    const route = useRoute();

    const currentExpressionPost = ref({});
    const expressionLanguage = ref("");
    const linkData = ref({});
    const expressionUrl = ref("");

    const postExpression = useMutation(CREATE_EXPRESSION, () => ({
      variables: {
        languageAddress: expressionLanguage.value,
        content: JSON.stringify(currentExpressionPost.value),
      },
    }));

    const getExpression = useLazyQuery(QUERY_EXPRESSION, () => ({
      url: expressionUrl.value,
    }));

    const addLink = useMutation<{
      addLink: ad4m.LinkExpression;
    }>(ADD_LINK, () => ({
      variables: {
        perspectiveUUID: route.params.channelId,
        link: JSON.stringify(linkData.value),
      },
    }));

    return {
      currentExpressionPost,
      expressionLanguage,
      linkData,
      postExpression,
      addLink,
      getExpression,
      expressionUrl,
    };
  },
  mounted() {
    console.log("Current mounted channel", this.channel);
    this.scrollToBottom();
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
    createExpression(
      message: JuntoShortForm,
      expressionLanguage: string
    ): Promise<string> {
      this.currentExpressionPost = message;
      this.expressionLanguage = expressionLanguage;
      return new Promise((resolve, reject) => {
        this.postExpression.onError((error) => {
          console.log("Got error posting expression", error);
          reject(error);
        });
        this.postExpression.mutate().then((result) => {
          resolve(result.data.createExpression);
        });
      });
    },

    createLink(link: ad4m.Link): Promise<ad4m.LinkExpression> {
      this.linkData = link;
      return new Promise((resolve, reject) => {
        this.addLink.onError((error) => {
          console.log("Got error posting link", error);
          reject(error);
        });
        this.addLink.mutate().then((addLinkResp) => {
          resolve(addLinkResp.data!.addLink);
        });
      });
    },

    getExpressionMethod(url: string) {
      this.expressionUrl = url;
      return new Promise((resolve, reject) => {
        this.getExpression.onResult((result) => {
          resolve(result.data);
        });
        this.getExpression.onError((error) => {
          console.log("Got error in getExpression", error);
          reject(error);
        });
        this.getExpression.load();
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

      let exprUrl = await this.createExpression(
        message,
        shortFormExpressionLanguage
      );
      console.log("Created expression with hash", exprUrl);
      let addLink = await this.createLink({
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
