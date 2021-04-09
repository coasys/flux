<template>
  <div class="welcomeViewRight">
    <div class="welcomeViewRight__spec">
      <h3 class="welcomeViewRight__spec--title">Name</h3>
      <div class="welcomeViewRight__input">
        <input type="text" class="welcomeViewRight__input--field" />
      </div>
    </div>

    <div class="welcomeViewRight__spec">
      <h3 class="welcomeViewRight__spec--title">Username</h3>
      <div class="welcomeViewRight__input">
        <input type="text" class="welcomeViewRight__input--field" />
      </div>
    </div>
    <div class="welcomeViewRight__spec">
      <h3 class="welcomeViewRight__spec--title">Email</h3>
      <div class="welcomeViewRight__input">
        <input type="text" class="welcomeViewRight__input--field" />
      </div>
    </div>
    <div class="welcomeViewRight__spec">
      <h3 class="welcomeViewRight__spec--title">Password</h3>
      <div class="welcomeViewRight__input">
        <input type="text" class="welcomeViewRight__input--field" />
      </div>
    </div>
    <button class="welcomeViewRight__button" @click="navigateToApp">
      Create
    </button>
  </div>
</template>

<script>
export default {
  methods: {
    navigateToApp() {
      this.$router.push("/home");
    },
  },
};
</script>
<style lang="scss" scoped>
.welcomeViewRight {
  display: flex;
  flex-direction: column;
  padding: 4rem 20rem 2rem 10rem;
  width: 100%;

  &__spec {
    display: flex;
    flex-direction: column;
    margin-bottom: 4rem;
    &--title {
      font-size: 1.4rem;
      font-weight: 500;
      color: var(--junto-primary-light);
      text-transform: uppercase;
      margin-bottom: 1rem;
    }
  }

  &__input {
    display: flex;
    flex-direction: column;
    border: 1.5px solid var(--junto-border-color);
    border-radius: 5px;

    &--field {
      outline: none;
      padding: 1rem;
      border: 1px;
      background-color: transparent;
      color: var(--junto-primary);
      font-size: 1.4rem;
    }
  }

  &__button {
    width: 100%;
    background-color: var(--junto-accent-color);
    border: none;
    outline: none;
    border-radius: 5px;
    padding: 2rem;
    color: white;
    font-weight: 700;
    font-size: 1.7rem;

    &:hover {
      cursor: pointer;
    }
  }
}
</style>
