<template>
  <Header :isSynced="isSynced"></Header>
  <Members></Members>
  <ChannelList></ChannelList>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ChannelList from "./ChannelList.vue";
import Members from "./Members.vue";
import Header from "./Header.vue";

export default defineComponent({
  components: { ChannelList, Members, Header },
  props: {
    isSynced: Boolean,
  },
});
</script>
