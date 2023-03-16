<template>
  <component :is="name"></component>
</template>

<script>
export default {
  props: ["name", "type", ""],
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
