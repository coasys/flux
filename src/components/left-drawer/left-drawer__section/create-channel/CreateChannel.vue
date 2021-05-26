<template>
  <teleport to="body">
    <div class="createChannel">
      <div class="createChannel__dialog">
        <div class="createChannel__dialog--top">
          <div class="createChannel__dialog--title">
            <h2 class="createChannel__dialog--title--text">Create a channel</h2>
            <div
              class="createChannel__dialog--title--container"
              @click="showCreateChannel"
            >
              <svg class="createChannel__dialog--title--icon">
                <use href="../../../../assets/icons/icons.svg#cancel"></use>
              </svg>
            </div>
          </div>
          <p class="createChannel__dialog--description">
            Channels are ways to organize your conversations by topics.
          </p>
          <create-channel-text-field
            v-model="channelName"
          ></create-channel-text-field>
        </div>
        <div class="createChannel__dialog--bottom">
          <create-channel-button @click="create"></create-channel-button>
        </div>
      </div>
    </div>
  </teleport>
  <junto-loader v-if="showLoader"></junto-loader>
</template>

<script lang="ts">
import CreateChannelTextField from "./CreateChannelTextField.vue";
import CreateChannelButton from "./CreateChannelButton.vue";
import { createChannel } from "@/core/methods/createChannel";
import { v4 as uuidv4 } from "uuid";
import { defineComponent } from "vue-demi";
import { MembraneType } from "@/store";
import JuntoLoader from '@/components/ui/animations/JuntoLoader.vue';

export default defineComponent({
  components: {
    CreateChannelTextField,
    CreateChannelButton,
    JuntoLoader,
  },
  data() {
    return {
      channelName: "",
      showLoader: false,
    };
  },
  methods: {
    async create() {
      this.showLoader = true;
      const community = this.$store.getters.getCurrentCommunity.value;
      const uid = uuidv4().toString();
      const channel = await createChannel(
        this.channelName,
        "",
        uid,
        community.perspective,
        community.linkLanguageAddress,
        community.expressionLanguages,
        MembraneType.Inherited,
        community.typedExpressionLanguages
      );

      this.$store.commit({
        type: "addChannel",
        value: {
          community: community.perspective,
          channel,
        },
      });

      this.showCreateChannel();
      this.showLoader = false;
    },
  },
  props: ["showCreateChannel"],
});
</script>

<style lang="scss">
@import "../../../../assets/sass/main.scss";
.createChannel {
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;

  &__dialog {
    height: 60vh;
    width: 30vw;
    background-color: var(--junto-background-color);
    border-radius: 25px;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 40rem;

    &--title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;

      &--text {
        font-size: 2.8rem;
        font-weight: 700;
      }

      &--container {
        background-color: transparent;
        display: flex;
        align-items: center;
        justify-content: flex-end;

        &:hover {
          cursor: pointer;
        }
      }

      &--icon {
        height: 3rem;
        width: 3rem;
        fill: var(--junto-primary);
      }
    }

    &--description {
      font-size: 1.6rem;
      font-weight: 500;
      color: var(--junto-primary-medium);
      margin-bottom: 3rem;
    }
  }
}
</style>
