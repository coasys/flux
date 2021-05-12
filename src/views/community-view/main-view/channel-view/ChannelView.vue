<template>
  <div class="channelView">
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
            <message-date
              v-if="item.type === 'date'"
              :date="item.date"
            ></message-date>
            <direct-message
              v-if="item.type === 'message'"
              :message="item.message"
              :showAvatar="showAvatar(index)"
            ></direct-message>
          </dynamic-scroller-item>
      </template>
    </dynamic-scroller>
    <create-direct-message
      :createMessage="createDirectMessage"
    ></create-direct-message>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import DirectMessage from "../../../../components/direct-message/display/DirectMessage.vue";
import CreateDirectMessage from "../../../../components/direct-message/create/CreateDirectMessage.vue";
import { JuntoShortForm } from "@/core/juntoTypes";
import {
  CREATE_EXPRESSION,
  ADD_LINK,
  QUERY_EXPRESSION,
  SOURCE_PREDICATE_LINK_QUERY_TIME_PAGINATED,
} from "@/core/graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";
import { useLazyQuery, useMutation } from "@vue/apollo-composable";
import { ChannelState } from "@/store/index";
import Expression from "@perspect3vism/ad4m/Expression";
import { differenceInMinutes, format, parseISO } from "date-fns";
import MessageDate from './MessageDateHeader.vue';

interface ChatItem {
  id: string;
  type: 'date' | 'message';
  date?: Date | string | number;
  message?: Expression;
}

export default defineComponent({
  props: ["community"],
  setup() {
    const currentExpressionPost = ref({});
    const expressionLanguage = ref("");
    const linkData = ref({});
    const currentPerspective = ref("");
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
        perspectiveUUID: currentPerspective.value,
        link: JSON.stringify(linkData.value),
      },
    }));

    var dateOffset = 24 * 60 * 60 * 1000 * 3; //3 days
    var myDate = new Date();
    myDate.setTime(myDate.getTime() - dateOffset);
    const now = new Date();
    const getChatChannelLinks = useLazyQuery(
      SOURCE_PREDICATE_LINK_QUERY_TIME_PAGINATED,
      () => ({
        perspectiveUUID: currentPerspective.value,
        source: "sioc://chatchannel",
        predicate: "sioc://content_of",
        from: myDate,
        to: now,
      })
    );

    getChatChannelLinks.onResult((result) => {
      console.log("Got links", result);
    });

    return {
      currentExpressionPost,
      expressionLanguage,
      linkData,
      currentPerspective,
      postExpression,
      addLink,
      getExpression,
      expressionUrl,
      getChatChannelLinks,
    };
  },
  mounted() {
    console.log("Current mounted channel", this.getCurrentChannel);
    this.currentPerspective = this.getCurrentChannel?.perspective;
    console.log("Perspective set in composition fn", this.currentPerspective);
    this.scrollToBottom();
  },
  watch: {
    getCurrentChannel: {
      handler: function (newVal) {
        console.log("Updating current perspective", newVal);
        if (newVal != undefined) {
          this.currentPerspective = newVal.perspective;
        }
        this.getChatChannelLinks.load();
        this.getChatChannelLinks.onResult((result) => {
          console.log("Got links", result);
        });
      },
    },
  },
  computed: {
    getCurrentChannel(): ChannelState {
      return this.$store.getters.getCurrentChannel;
    },
    messageList(): Array<ChatItem> {
      const obj: { [x: string]: Array<Expression> } = {};
      const list: Array<ChatItem> = [];
      let i = 0;

      this.getCurrentChannel?.currentExpressionMessages.forEach((e) => {
        const formattedDate = format(parseISO(e.timestamp), 'MM/dd/yyyy');
        if (obj[formattedDate] !== undefined) {
          obj[formattedDate].push(e);
        } else {
          obj[formattedDate] = [e];
        }
      });

      Object.entries(obj).forEach(([key, value]) => {
        list.push({
          id: i.toString(),
          type: 'date',
          date: key,
        });
        i += 1;

        value.forEach((v) => {
          list.push({
            id: i.toString(),
            type: 'message',
            message: v,
          });
          i += 1;
        });
      });
      console.log('list', list);
      return list;
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
      let shortFormExpressionLanguage = this.community.value
        .expressionLanguages[0]!;
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

    showAvatar(index: number): boolean {
      const previousMessage = this.messageList[index - 1];
      const message = this.messageList[index];

      if (index <= 0 || previousMessage === undefined || message === undefined) {
        return true;
      }

      if (previousMessage.type === 'date') {
        return true;
      }

      if (previousMessage.message?.author.name !== message.message?.author.name) {
        return true;
      }

      return (
        previousMessage.message?.author.name === message.message?.author.name
        && differenceInMinutes(
          parseISO(message.message!.timestamp!)?? Date.now(),
          parseISO(previousMessage.message!.timestamp!) ?? Date.now(),
        ) >= 2
      );
    },
  },

  components: {
    DirectMessage,
    CreateDirectMessage,
    DynamicScroller,
    DynamicScrollerItem,
    MessageDate,
  },
});
</script>

<style lang="scss">
.channelView {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  min-height: 100vh;

  &__messages {
    display: flex;
    flex-direction: column;
    align-items: center;
    // overflow: scroll;
    width: 100%;
    // 9.5 = 7.5rem (height of MainVewTopBar) + 2rem
    padding: 9.5rem 2rem 7.5rem 2rem;
  }
}
</style>
