<template>
  <j-carousel class="slider">
    <div class="slider__slide">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <img width="500" src="@/assets/images/app-secure.png" />
        </j-box>
        <j-text variant="heading-lg">Communicate Privately and Freely</j-text>
        <j-text variant="ingress">
          Without central servers, there's no way for third-parties to eavesdrop
          on your conversations or sell your data to advertisers
        </j-text>
      </div>
    </div>
    <div class="slider__slide">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <img width="500" src="@/assets/images/app-secure.png" />
        </j-box>
        <j-text variant="heading-lg">
          Create Groups, Communities and Networks
        </j-text>
        <j-text variant="ingress">
          Organize and aggregate social organisms of any size or scale with a
          level of fluidity and interoperability only possible with p2p design
        </j-text>
      </div>
    </div>
    <div class="slider__slide">
      <div class="slider__slide-content">
        <j-box pt="500" pb="800">
          <img width="500" src="@/assets/images/app-secure.png" />
        </j-box>
        <j-text variant="heading-lg">Take Back the Internet</j-text>
        <j-text variant="ingress">
          With Holochain's agent-centric application framework, you own your
          data, manage your identity, and host the apps that you use with those
          you trust
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
  max-width: 700px;
  margin: 0 auto;
}
</style>
