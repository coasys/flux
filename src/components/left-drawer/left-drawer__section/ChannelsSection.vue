<template>
  <div class="left-drawer__section">
    <div class="left-drawer__section--title">
      <p class="left-drawer__section--title--name">CHANNELS</p>

      <create-channel-icon></create-channel-icon>
    </div>
    <div class="left-drawer__section--items">
      <left-drawer-section-item
        v-for="channel in community.channels"
        :key="channel"
        :title="channel"
        type="channel"
      ></left-drawer-section-item>
    </div>
  </div>
</template>
<script>
import LeftDrawerSectionItem from "./LeftDrawerSectionItem.vue";
import CreateChannelIcon from "./create-channel/CreateChannelIcon.vue";
export default {
  props: {
    community: Object,
  },

  components: {
    LeftDrawerSectionItem,
    CreateChannelIcon,
  },
};
</script>
