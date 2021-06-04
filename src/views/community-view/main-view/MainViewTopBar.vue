<template>
  <div class="mainView__topBar">
    <j-flex style="width: 100%" a="center" j="between">
      <j-flex gap="300" a="center">
        <j-icon size="sm" name="hash" />
        <j-text nomargin weight="500" size="500">{{ channel.name }}</j-text>
      </j-flex>
      <j-tooltip title="Copy invite link">
        <j-button size="sm">
          <j-icon size="sm" name="person-plus" @click="getInviteCode"> </j-icon>
        </j-button>
      </j-tooltip>
    </j-flex>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: ["channel", "community"],
  computed: {
    setIcon() {
      let icon;
      switch (this.channel?.type) {
        case "feed":
          icon = "#feed";
          break;
        case "channel":
          icon = "#hashtag";
          break;
        default:
          icon = "#feed";
          break;
      }
      return icon;
    },
  },
  methods: {
    getInviteCode() {
      // Get the invite code to join community and copy to clipboard
      let currentCommunity = this.community;
      const el = document.createElement("textarea");
      el.value = `Hey! Here is an invite code to join my private community on Junto: ${currentCommunity.sharedPerspectiveUrl}`;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      alert("Your custom invite code is copied to your clipboard!");
    },
  },
});
</script>
<style lang="scss">
.mainView__topBar {
  z-index: 2000;
  height: 7.5rem;
  background-color: var(--j-color-white);
  width: 100%;
  border-bottom: 1px solid var(--j-color-ui-50);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  left: 0;
}
</style>
