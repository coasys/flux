<template>
  <teleport to="body">
    <div class="singleActionDialog">
      <div class="singleActionDialog__dialog">
        <div class="singleActionDialog__dialog--top">
          <p class="singleActionDialog__dialog--description">
            {{ dialogText }}
          </p>
        </div>
        <div
          class="singleActionDialog__dialog--bottom"
          @click="showSingleActionDialog"
        >
          CLOSE
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    dialogText: String,
    showSingleActionDialog: Function,
  },
});
</script>

<style lang="scss">
.singleActionDialog {
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
    min-height: 25vh;
    width: 30vw;
    background-color: var(--junto-background-color);
    border-radius: 25px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 40rem;

    &--top {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &--description {
      padding: 2rem 0 2rem 0;
      font-size: 2rem;
      font-weight: 500;
      color: var(--junto-primary-medium);
    }

    &--bottom {
      display: flex;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--junto-primary-light);
      padding: 1rem;

      &:hover {
        cursor: pointer;
      }
    }
  }
}
</style>
