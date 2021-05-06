<template>
  <div class="communityActionsButton">
    <p class="communityActionsButton__text">JOIN</p>
  </div>
</template>

<style lang="scss" scoped>
.communityActionsButton {
  background-color: var(--junto-accent-color);
  padding: 1rem 2rem;
  border-radius: 10px;
  margin-bottom: 5rem;

  &:hover {
    cursor: pointer;
    transition: all 0.2s;
  }
  &__text {
    font-size: 1.2rem;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-align: center;
    color: white;
    font-weight: 700;
  }
}
</style>
