<template>
  <div class="create-community-icon" @click="showCreateCommunity">
    <svg class="create-community-icon__icon">
      <use href="@/assets/icons/icons.svg#plus"></use>
    </svg>
    <div class="create-community-icon__name">
      <p class="create-community-icon__name--text">New Community</p>
    </div>
  </div>
  <create-community
    v-if="activateCreateCommunity"
    :showCreateCommunity="showCreateCommunity"
  ></create-community>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CreateCommunity from "./CreateCommunity.vue";
export default defineComponent({
  data() {
    return {
      activateCreateCommunity: false,
    };
  },
  components: {
    CreateCommunity,
  },
  methods: {
    showCreateCommunity() {
      this.activateCreateCommunity = !this.activateCreateCommunity;
    },
  },
});
</script>

<style lang="scss" scoped>
@import "@/assets/sass/main.scss";
.create-community-icon {
  height: 5rem;
  width: 5rem;
  background-color: var(--junto-border-color);
  border-radius: 100px;
  margin-bottom: 2rem;
  background-image: url("../../../../src/assets/images/junto_web_rainbow.png");
  background-size: cover;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    cursor: pointer;
    transition: all 0.2s;
  }
  &:hover &__name {
    visibility: visible;
    transition: all 0.2s;
  }
  &__icon {
    fill: white;
    height: 2.2rem;
    width: 2.2rem;
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
