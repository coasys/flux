<template>
  <div class="textMessage">
    <p class="textMessage__text">
      {{ text }}
    </p>
  </div>
</template>

<script>
export default {
  props: ["text"],
};
</script>

<style lang="scss" scoped>
.textMessage {
  &__text {
    margin-top: 1rem;
    font-size: 1.5rem;
    font-weight: 400;
  }
}
</style>