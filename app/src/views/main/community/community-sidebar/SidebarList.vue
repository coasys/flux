<template>
  <j-box mt="800" mb="400" px="500">
    <j-flex direction="column" gap="400">
      <div class="header">
        <j-icon :name="icon" size="sm" color="ui-400" />

        <j-text color="ui-400" uppercase nomargin>{{ title }}</j-text>

        <j-box ml="200" mt="100" v-if="loading">
          <j-spinner size="xxs" />
        </j-box>
      </div>

      <j-flex direction="column">
        <SidebarItem v-for="item in items" :key="item.channel.baseExpression" :item="item" />
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script setup lang="ts">
import SidebarItem from "@/views/main/community/community-sidebar/SidebarItem.vue";
import { defineOptions } from "vue";

defineOptions({ name: "SidebarList" });

type Props = { title: string; icon: string; loading: boolean; items: any[] };
const { title, icon, loading, items } = defineProps<Props>();
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  height: 25px;
}
</style>
