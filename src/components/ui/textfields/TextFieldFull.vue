<template>
  <div class="textFieldFull">
    <h2 class="textFieldFull__title">{{ title }}</h2>
    <div class="textFieldFull__input">
      <input class="textFieldFull__input--field" :maxlength="maxLength" />
    </div>
    <p class="textFieldFull__description">
      {{ description }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    maxLength: Number,
  },
});
</script>

<style lang="scss">
@import '@/assets/sass/main.scss';
.textFieldFull {
  &__title {
    font-size: 1.7rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  &__input {
    border: 1px solid var(--junto-border-color);
    padding: 1rem;
    margin-bottom: 1rem;
    height: 3.6rem;
    border-radius: 5px;

    &--field {
      width: 100%;
      outline: none;
      font-size: 1.4rem;
      background-color: transparent;
      border: none;
      color: var(--junto-primary);
    }
  }

  &__description {
    font-size: 1.4rem;
    color: var(--junto-primary-light);
    font-weight: 500;
  }
}
</style>
