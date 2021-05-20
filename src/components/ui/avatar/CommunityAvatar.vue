<template>
  <div
    class="community-avatar"
    @click="navToCommunity()"
    v-tooltip="community.value.name"
  >
    <!-- <div class="community-avatar__name">
      <p class="community-avatar__name--text">{{ community.value.name }}</p>
    </div> -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: ["community", "getPerspectiveChannelsAndMetaData"],

  methods: {
    async navToCommunity() {
      this.getPerspectiveChannelsAndMetaData(this.community);
      this.$store.commit({ type: "changeCommunity", value: this.community });
    },
  },
});
</script>

<style lang="scss" scoped>
@import "../../../assets/sass/main.scss";
.community-avatar {
  min-height: 5rem;
  min-width: 5rem;
  background-color: var(--junto-border-color);
  border-radius: 100px;
  margin-bottom: 2rem;
  background-image: url("../../../../src/assets/images/junto_app_icon.png");
  background-size: cover;
  position: relative;

  &:hover {
    cursor: pointer;
    transition: all 0.2s;
  }

  &:hover &__name {
    visibility: visible;
    transition: all 0.2s;
  }

  &__name {
    visibility: hidden;
    padding: 1rem;
    background-color: var(--junto-primary);
    border-radius: 5px;
    position: absolute;
    top: 0.5rem;
    left: 6rem;

    &--text {
      color: var(--junto-background-color);
      font-size: 1.2rem;
      font-weight: 700;
    }
  }
}
</style>
