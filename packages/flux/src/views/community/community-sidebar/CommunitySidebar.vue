<template>
  <Header></Header>
  <Members></Members>
  <ChannelList></ChannelList>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, watch } from "vue";
import ChannelList from "./ChannelList.vue";
import Members from "./Members.vue";
import Header from "./Header.vue";

export default defineComponent({
  components: { ChannelList, Members, Header },
});
</script>
