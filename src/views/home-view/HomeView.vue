<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <div class="home-sidebar">
        <j-box px="500" pb="1000">
          <j-flex a="center" gap="400">
            <img
              class="logo__img"
              width="25"
              src="https://junto.foundation/dist/junto-home-2.0__logo--rainbow.png?d9ff94e4e39bfd0536e60f760a9e6bd7"
            />
            <j-text nomargin class="logo_text" size="600" variant="body">
              Home
            </j-text>
          </j-flex>
        </j-box>
        <j-box pb="500">
          <j-menu-group-item title="About">
            <j-menu-item>Intro</j-menu-item>
            <j-menu-item>Foundation</j-menu-item>
            <j-menu-item>Team</j-menu-item>
            <j-menu-item>Values</j-menu-item>
            <j-menu-item>Contributing</j-menu-item>
            <j-menu-item>Measuring impact</j-menu-item>
            <j-menu-item>FAQ</j-menu-item>
          </j-menu-group-item>
        </j-box>
      </div>
    </template>
    <div>Halla</div>
  </sidebar-layout>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import SidebarLayout from "@/layout/SidebarLayout.vue";

export default defineComponent({
  name: "HomeView",
  components: { SidebarLayout },
});
</script>

<style scoped>
.home-sidebar {
  padding-top: var(--j-space-800);
}
</style>
