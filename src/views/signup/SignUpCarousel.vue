<template>
  <j-carousel class="slider">
    <div class="slider__slide">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <img width="500" src="@/assets/images/app-secure.png" />
        </j-box>
        <j-text variant="heading-lg">Communicate privately and freely</j-text>
        <j-text variant="ingress">
          Without central servers we make sure there is no third-party involved
          that can eavesdrop on your converstions and try to sell your data.
        </j-text>
      </div>
    </div>
    <div class="slider__slide">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <img width="500" src="@/assets/images/app-secure.png" />
        </j-box>
        <j-text variant="heading-lg">Own your own information</j-text>
        <j-text variant="ingress">
          Without central servers we make sure there is no third-party involved
          that can eavesdrop on your converstions and try to sell your data.
        </j-text>
      </div>
    </div>
    <div class="slider__slide">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <img width="500" src="@/assets/images/app-secure.png" />
        </j-box>
        <j-text variant="heading-lg">Organize your communitcation</j-text>
        <j-text variant="ingress">
          Without central servers we make sure there is no third-party involved
          that can eavesdrop on your converstions and try to sell your data.
        </j-text>
      </div>
    </div>
  </j-carousel>
</template>

<style scoped>
.slider__slide {
  text-align: center;
}

.slider__slide-content {
  max-width: 750px;
  margin: 0 auto;
}
</style>
