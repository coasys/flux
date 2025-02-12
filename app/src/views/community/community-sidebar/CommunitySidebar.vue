<template>
  <Header :community="community" :isSynced="isSynced"></Header>
  <Members></Members>
  <ChannelList :perspective="perspective" :community="community"></ChannelList>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ChannelList from "./ChannelList.vue";
import Members from "./Members.vue";
import Header from "./Header.vue";
import { PerspectiveProxy } from "@coasys/ad4m";

export default defineComponent({
  components: { ChannelList, Members, Header },
  props: {
    community: {
      type: Object,
      required: true,
    },
    perspective: {
      type: Object, // PerspectiveProxy,
      required: true,
    },
    isSynced: Boolean,
  },
});
</script>
