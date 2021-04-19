<template>
  <div class="createButton">
    <div>&nbsp;</div>
    <button class="createButton__button">Create</button>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/sass/main.scss';
.createButton {
  display: flex;
  justify-content: space-between;

  &__button {
    padding: 1rem 2rem;
    outline: none;
    border-radius: 5px;
    box-shadow: none;
    background-color: var(--junto-border-color);
    border: none;
    text-decoration: none;
    color: var(--junto-primary);
    &:hover {
      cursor: pointer;
      background-color: var(--junto-accent-color);
      transition: all 0.2s;
      color: white;
    }
  }
}
</style>
