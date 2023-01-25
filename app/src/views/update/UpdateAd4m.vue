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
      <j-button size="xl" variant="primary" @click="downloadLatestAd4m">
        Download update
      </j-button>
    </j-flex>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { dependencies } from "../../../package.json";

function detectOS(): string {
  let os = navigator.userAgent;
  let finalOs = "";
  if (os.search("Windows") !== -1) {
    finalOs = "Windows";
  } else if (os.search("Mac") !== -1) {
    finalOs = "MacOS";
  } else if (os.search("X11") !== -1 && !(os.search("Linux") !== -1)) {
    finalOs = "UNIX";
  } else if (os.search("Linux") !== -1 && os.search("X11") !== -1) {
    finalOs = "Linux";
  }
  return finalOs;
}

export default defineComponent({
  name: "SignUp",
  setup() {
    return {
      ref,
    };
  },
  computed: {
    link() {
      const urlBase = `https://github.com/perspect3vism/ad4m/releases/download`;
      const version = dependencies["@perspect3vism/ad4m"];
      const OSName = detectOS();
      if (OSName === "MacOS") {
        return `${urlBase}/v${version}/AD4M_${version}_x64.dmg`;
      }
      if (OSName === "UNIX" || OSName === "Linux") {
        return `${urlBase}/v${version}/ad4m_${version}_amd64.deb`;
      }
      if (OSName === "Windows") {
        return `${urlBase}/v${version}/AD4M_${version}_x64_en-US.msi`;
      }
      return "";
    },
  },
  methods: {
    downloadLatestAd4m() {
      const link = document.createElement("a");
      link.setAttribute("href", this.link);
      link.click();
    },
  },
});
</script>

<style scoped>
.update-ad4m-view {
  text-align: center;
  height: 100%;
  display: grid;
  place-items: center;
}
</style>
