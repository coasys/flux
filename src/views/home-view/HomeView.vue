<template>
  <sidebar-layout>
    <template v-slot:sidebar>
      <div class="home-sidebar">
        <j-box px="500" pb="700">
          <j-text nomargin size="600" weight="500" color="ui-900">Home</j-text>
        </j-box>
        <j-box pb="800">
          <j-menu-item
            :selected="$route.name === 'my-communities'"
            @click="() => $router.push({ name: 'my-communities' })"
            size="lg"
          >
            <j-icon name="globe2" slot="start" />
            Communities
          </j-menu-item>
          <j-menu-item
            :selected="$route.name === 'settings'"
            @click="() => $router.push({ name: 'my-profile', params: { did } })"
            size="lg"
          >
            <j-icon name="gear" slot="start" />
            Profile
          </j-menu-item>
          <j-menu-item
            :selected="$route.name === 'settings'"
            @click="() => $router.push({ name: 'settings' })"
            size="lg"
          >
            <j-icon name="gear" slot="start" />
            Settings
          </j-menu-item>
        </j-box>
        <j-box>
          <j-menu-group-item title="About">
            <j-menu-item
              :selected="$route.name === 'tutorial'"
              @click="() => $router.push({ name: 'tutorial' })"
            >
              <j-icon size="sm" name="map" slot="start" />
              Tutorial
            </j-menu-item>
            <j-menu-item
              :selected="$route.name === 'foundation'"
              @click="() => $router.push({ name: 'foundation' })"
            >
              <j-icon size="sm" name="building" slot="start" />
              Junto Foundation
            </j-menu-item>
            <j-menu-item
              :selected="$route.name === 'privacy-policy'"
              @click="() => $router.push({ name: 'privacy-policy' })"
            >
              <j-icon size="sm" name="lock" slot="start" />
              Privacy policy
            </j-menu-item>
            <j-menu-item
              :selected="$route.name === 'faq'"
              @click="() => $router.push({ name: 'faq' })"
            >
              <j-icon size="sm" name="question" slot="start" />
              FAQ
            </j-menu-item>
          </j-menu-group-item>
        </j-box>
      </div>
    </template>
    <router-view />
  </sidebar-layout>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import SidebarLayout from "@/layout/SidebarLayout.vue";
import { ad4mClient } from "@/app";

export default defineComponent({
  name: "HomeView",
  components: { SidebarLayout },
  data() {
    return {
      did: "",
    };
  },
  async mounted() {
    const me = await ad4mClient.agent.me();

    this.did = me.did;
  },
});
</script>

<style scoped>
.home-sidebar {
  padding-top: var(--j-space-800);
}
</style>
