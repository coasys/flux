<template>
  <j-box p="800">
    <j-flex direction="column" gap="500">
      <j-text variant="heading-sm">Edit Channel</j-text>

      <j-input
        size="lg"
        label="Name"
        :value="name"
        @keydown.enter="updateChannel"
        @input="(e) => (name = e.target.value)"
      ></j-input>

      <j-box v-if="isLoading" align="center" p="500">
        <j-spinner></j-spinner>
      </j-box>

      <j-flex v-if="!isLoading" direction="column" gap="500">
        <div class="app-card" v-for="pkg in packages" :key="pkg.packageName">
          <j-box pb="500">
            <j-badge
              size="sm"
              v-if="pkg.packageName.startsWith('@junto-foundation')"
              variant="success"
            >
              Official App
            </j-badge>
          </j-box>
          <j-flex a="center" j="between">
            <j-flex gap="500" a="center" j="center">
              <j-icon size="lg" v-if="pkg.icon" :name="pkg.icon"></j-icon>
              <div>
                <j-text variant="heading-sm">
                  {{ pkg.name }}
                </j-text>
                <j-text nomargin>
                  {{ pkg.description }}
                </j-text>
              </div>
            </j-flex>
            <div>
              <j-button
                :variant="isSelected(pkg) ? 'subtle' : 'primary'"
                @click="() => toggleView(pkg)"
              >
                {{ isSelected(pkg) ? "Remove" : "Add" }}
              </j-button>
            </div>
          </j-flex>
        </div>
      </j-flex>

      <j-box mt="500">
        <j-flex direction="row" j="end" gap="300">
          <j-button size="lg" variant="link" @click="() => $emit('cancel')">
            Cancel
          </j-button>
          <j-button
            :loading="isSaving"
            :disabled="!canSave || isSaving"
            @click="updateChannel"
            size="lg"
            variant="primary"
          >
            Save
          </j-button>
        </j-flex>
      </j-box>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useAppStore } from "@/store/app";
import { useDataStore } from "@/store/data";
import { FluxApp, getAllFluxApps } from "@/utils/npmApi";

export default defineComponent({
  props: ["channelId"],
  emits: ["cancel", "submit"],
  async created() {
    this.isLoading = true;
    const res = await getAllFluxApps();
    this.isLoading = false;
    this.packages = res;
  },
  setup() {
    return {
      isLoading: ref(false),
      packages: ref<FluxApp[]>([]),
      name: ref(""),
      description: ref(""),
      views: ref<FluxApp[]>([]),
      isSaving: ref(false),
      appStore: useAppStore(),
      dataStore: useDataStore(),
    };
  },
  computed: {
    canSave() {
      return this.views.length >= 1;
    },
    channel() {
      return this.dataStore.channels[this.channelId];
    },
  },
  watch: {
    channel: {
      handler: async function ({ name, description, views }) {
        this.name = name;
        this.description = description;
        this.views = views;
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    toggleView(pkg: FluxApp) {
      const isSelected = this.views.some(
        (app) => app.packageName === pkg.packageName
      );
      this.views = isSelected
        ? this.views.filter((app) => app.packageName !== pkg.packageName)
        : [...this.views, pkg];
    },
    isSelected(pkg: any) {
      return this.views.some((app) => app.packageName === pkg.packageName);
    },
    async updateChannel() {
      this.isSaving = true;
      this.dataStore
        .updateChannel({
          channelId: this.$route.params.channelId as string,
          data: {
            name: this.name,
            views: this.views,
          },
        })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isSaving = false;
        });
    },
  },
});
</script>

<style scoped>
.app-card {
  padding: var(--j-space-500);
  border-radius: var(--j-border-radius);
  background: var(--j-color-ui-50);
  border: 1px solid var(--j-color-ui-100);
}
</style>
