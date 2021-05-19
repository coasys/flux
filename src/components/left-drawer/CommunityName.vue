<template>
  <div class="community-name">
    <p class="community-name__name">{{ title }}</p>
    <p class="community-name__description">{{ description }}</p>
  </div>
</template>


<script>
export default {
  props: {
    title: String,
    description: String
  },
};
</script>
 <style lang="scss" scoped>
.community-name {
  width: 100%;
  margin-bottom: 3rem;

  &__name {
    font-size: 2.2rem;
    font-weight: 500;
    color: var(--junto-primary);
  }

  &__description {
    font-size: 1.2rem;
    margin-top: 1rem;
    color: var(--junto-primary-medium);
  }
}
</style>