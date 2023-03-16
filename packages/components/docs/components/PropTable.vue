<template>
  <div v-for="(attribute, index) in attributes" :key="index">
    <div class="attribute-name">{{ attribute.name }}</div>

    <hr />

    <dl>
      <dt>Description</dt>
      <dd>{{ attribute.description }}</dd>
      <dt>Type</dt>
      <dd>{{ attribute.type }}</dd>
      <dt>Default</dt>
      <dd>{{ attribute.default }}</dd>
    </dl>
  </div>
</template>

<script>
export default {
  props: ["attributes"],
};
</script>

<style>
.attribute-name {
  display: inline-block;
  padding: 0px 5px;
  border-radius: 4px;
  background-color: var(--j-color-primary-500);
}

dl {
  display: grid;
  grid-template-columns: 1fr 10fr;
  margin-bottom: var(--j-space-900);
}

dt {
  font-weight: 600;
}
</style>
