<template>
  <div class="welcomeViewLeft">
    <h2 class="welcomeViewLeft__title">JUNTO</h2>
    <p class="welcomeViewLeft__subtitle">
      Welcome to the next generation <br />of social media.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.welcomeViewLeft {
  display: flex;
  flex-direction: column;
  padding: 2rem 10rem 2rem 20rem;
  width: 100%;

  &__title {
    font-size: 4rem;
    font-weight: 400;
    color: var(--junto-primary);
    margin-bottom: 1rem;
  }

  &__subtitle {
    color: var(--junto-primary-medium);
    font-size: 2.4rem;
  }
}
</style>