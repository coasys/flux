<template>
  <div class="createChannelTextField">
    <h2 class="createChannelTextField__title">Name</h2>
    <div class="createChannelTextField__input">
      <input class="createChannelTextField__input--field" maxlength="22" />
    </div>
    <p class="createChannelTextField__description">
      Channel names can contain letters, numbers, hypens, and underscores.
    </p>
  </div>
</template>



<style lang="scss">
@import "../../../../assets/sass/main.scss";
.createChannelTextField {
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