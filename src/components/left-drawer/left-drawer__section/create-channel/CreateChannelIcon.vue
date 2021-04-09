<template>
  <div class="createChannelIcon" @click="showCreateChannel">
    <svg class="createChannelIcon__icon">
      <use href="../../../../assets/icons/icons.svg#plus"></use>
    </svg>
  </div>
  <create-channel
    v-if="activateCreateChannel"
    :showCreateChannel="showCreateChannel"
  ></create-channel>
</template>

<script>
import CreateChannel from "./CreateChannel.vue";
export default {
  data() {
    return {
      activateCreateChannel: false,
    };
  },
  methods: {
    showCreateChannel() {
      console.log("toggling create channel view");
      this.activateCreateChannel = !this.activateCreateChannel;
    },
  },
  components: {
    CreateChannel,
  },
};
</script>

<style lang="scss">
.createChannelIcon {
  height: 2.4rem;
  width: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background-color: transparent;

  &:hover {
    cursor: pointer;
    transition: all 0.2s;
  }
  &__icon {
    fill: var(--junto-primary-light);
    height: 1.7rem;
    width: 1.7rem;
  }
}
</style>