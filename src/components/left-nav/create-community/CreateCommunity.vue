<template>
  <teleport to="body">
    <div class="createCommunity">
      <div class="createCommunity__dialog">
        <div class="createCommunity__dialog--top">
          <div class="createCommunity__dialog--title">
            <h2 class="createCommunity__dialog--title--text">
              Create a New Community
            </h2>
            <div
              class="createCommunity__dialog--title--container"
              @click="showCreateCommunity"
            >
              <svg class="createCommunity__dialog--title--icon">
                <use href="@/assets/icons/icons.svg#cancel"></use>
              </svg>
            </div>
          </div>
          <p class="createCommunity__dialog--description">
            Communities are the building blocks of Junto.
          </p>

          <text-field-full
            maxLength="50"
            title="Name"
            description="Name your community here"
          ></text-field-full>
          <spacer></spacer>
          <text-field-full
            maxLength="22"
            title="Handle"
            description="Choose a handle for your community.
            Handles can contain letters, numbers, hypens, and underscores."
          ></text-field-full>
          <spacer></spacer>
          <h2 class="createCommunity__title">Privacy</h2>
          <select name="privacy" class="createCommunity__privacy">
            <option value="Private">Private</option>
            <option value="Public">Public</option>
          </select>
        </div>

        <div class="createCommunity__dialog--bottom">
          <create-button></create-button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TextFieldFull from '../../ui/textfields/TextFieldFull.vue';
import CreateButton from '../../ui/buttons/CreateButton.vue';
import Spacer from '../../ui/spacer/Spacer.vue';
export default defineComponent({
  components: {
    TextFieldFull,
    CreateButton,
    Spacer,
  },
  props: {
    showCreateCommunity: Function,
  },
});
</script>

<style lang="scss">
@import '../../../assets/sass/main.scss';
.createCommunity {
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
  &__title {
    font-size: 1.7rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  &__privacy {
    outline: none;
    border: 1px solid var(--junto-border-color);
    background-color: var(--junto-background-color);
    padding: 0.5rem 1rem;
    font-size: 1.4rem;
    font-weight: 500;
    margin-bottom: 2rem;
    color: var(--junto-primary);
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    &:hover {
      cursor: pointer;
    }
  }
  &__dialog {
    max-width: 33vw;
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