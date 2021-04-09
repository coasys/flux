<template>
  <div class="community-name">
    <p class="community-name__name">{{ title }}</p>
  </div>
</template>


<script>
export default {
  props: {
    title: String,
  },
};
</script>
 <style lang="scss" scoped>
.community-name {
  width: 100%;
  display: flex;
  margin-bottom: 5rem;

  &__name {
    font-size: 2.2rem;
    font-weight: 500;
    color: var(--junto-primary);
  }
}
</style>