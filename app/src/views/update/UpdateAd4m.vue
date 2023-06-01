t
<template>
  <div class="update-ad4m-view">
    <j-flex direction="column" gap="500">
      <j-icon
        name="cone-striped"
        style="--j-icon-size: var(--j-size-xxl)"
      ></j-icon>
      <div>
        <j-text variant="heading-lg"> Upgrade required </j-text>
        <j-text variant="ingress">
          You are using an old version of AD4M. Please upgrade to continue using
          Flux.
        </j-text>
      </div>
      <j-button size="xl" variant="primary" href="https://ad4m.dev/download">
        Download update
      </j-button>
    </j-flex>
  </div>
</template>

<style scoped>
.update-ad4m-view {
  text-align: center;
  height: 100%;
  display: grid;
  place-items: center;
}
</style>
