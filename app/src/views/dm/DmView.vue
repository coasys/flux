<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      hello
      <j-box pt="500" pb="800">
        <j-menu-item v-for="did in friends">
          <Avatar size="xs" :did="did"></Avatar>
        </j-menu-item>
      </j-box>
    </template>

    <div>Hello</div>
  </sidebar-layout>
</template>

<script lang="ts">
import Avatar from "@/components/avatar/Avatar.vue";
import SidebarLayout from "@/layout/SidebarLayout.vue";
import { useUserStore } from "@/store/user";
import { defineComponent } from "vue";

export default defineComponent({
  name: "DmView",
  components: {
    SidebarLayout,
    Avatar,
  },
  setup() {
    return {
      userStore: useUserStore(),
    };
  },
  computed: {
    friends() {
      return this.userStore.friends;
    },
  },
});
</script>

<style scoped></style>
