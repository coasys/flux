<template>
  <div class="channelView">
    <div class="channelView__messages" ref="messagesContainer">
      <direct-message
        v-for="message in getCurrentChannel?.currentExpressionMessages"
        :key="message.url"
        :message="JSON.parse(message.data)"
      ></direct-message>
    </div>

    <create-direct-message
      :createMessage="createDirectMessage"
    ></create-direct-message>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import DirectMessage from "../../../../components/direct-message/display/DirectMessage.vue";
import CreateDirectMessage from "../../../../components/direct-message/create/CreateDirectMessage.vue";
import { JuntoShortForm } from "@/core/juntoTypes";
import {
  CREATE_EXPRESSION,
  ADD_LINK,
  QUERY_EXPRESSION,
  SOURCE_LINK_QUERY_TIME_PAGINATED,
} from "@/core/graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";
import { useLazyQuery, useMutation } from "@vue/apollo-composable";
import { ChannelState } from "@/store/index";

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
      SOURCE_LINK_QUERY_TIME_PAGINATED,
      () => ({
        perspectiveUUID: currentPerspective.value,
        source: "sioc://chatchannel",
        from: myDate,
        to: now,
      })
    );

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
    this.currentPerspective = this.getCurrentChannel.perspective;
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
  },

  components: {
    DirectMessage,
    CreateDirectMessage,
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
    overflow: scroll;
    // 9.5 = 7.5rem (height of MainVewTopBar) + 2rem
    padding: 9.5rem 2rem 7.5rem 2rem;
    flex: 1;
  }
}
</style>
