<template>
  <div class="channelView">
    <div class="channelView__messages" ref="messagesContainer">
      <direct-message
        v-for="message in currentChannel.currentExpressionLinks"
        :key="message.id"
        :message="message"
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
} from "@/core/graphql_queries";
import ad4m from "@perspect3vism/ad4m-executor";
import {
  useLazyQuery,
  useMutation,
  useQuery,
  useResult,
} from "@vue/apollo-composable";

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

    const getExpression = useQuery(QUERY_EXPRESSION, () => ({
      variables: {
        url: expressionUrl.value,
      },
    }));

    const addLink = useMutation<{
      addLink: ad4m.LinkExpression;
    }>(ADD_LINK, () => ({
      variables: {
        perspectiveUUID: currentPerspective.value,
        link: JSON.stringify(linkData.value),
      },
    }));

    return {
      currentExpressionPost,
      expressionLanguage,
      linkData,
      currentPerspective,
      postExpression,
      addLink,
      getExpression,
    };
  },
  mounted() {
    console.log("Current mounted channel", this.currentChannel);
    this.currentPerspective = this.currentChannel.perspective;
    console.log("Perspective set in composition fn", this.currentPerspective);
    this.scrollToBottom();
  },
  data() {
    return {
      currentChannel: this.$store.getters.getCurrentChannel,
    };
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

    async createDirectMessage(message: JuntoShortForm) {
      let shortFormExpressionLanguage = this.community.value
        .expressionLanguages[0]!;
      console.log(
        "Posting shortForm expression to language",
        shortFormExpressionLanguage
      );
      let expressionHash = await this.createExpression(
        message,
        shortFormExpressionLanguage
      );
      console.log("Created expression with hash", expressionHash);
      let addLink = await this.createLink({
        source: "sioc://chatchannel",
        target: expressionHash,
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
  max-height: 100vh;

  &__messages {
    overflow: scroll;
    // 9.5 = 7.5rem (height of MainVewTopBar) + 2rem
    padding: 9.5rem 2rem 7.5rem 2rem;
  }
}
</style>
