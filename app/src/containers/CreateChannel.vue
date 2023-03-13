<template>
  <j-box p="800">
    <j-flex direction="column" gap="700">
      <div>
        <j-text variant="heading-sm">Create Channel</j-text>
        <j-text variant="body">
          Channels are ways to organize your conversations by topics.
        </j-text>
      </div>
      <j-flex direction="column" gap="400">
        <j-input
          autofocus
          size="lg"
          label="Name"
          :minlength="10"
          :maxlength="30"
          autovalidate
          required
          type="text"
          :value="channelName"
          @keydown.enter="createChannel"
          @input="(e: any) => (channelName = e.target.value)"
        ></j-input>
        <j-box pb="500" pt="300">
          <j-box pb="300">
            <j-text variant="label">Select at least one view</j-text>
          </j-box>

          <j-box align="center" p="500">
            <j-spinner v-if="isLoading"></j-spinner>
          </j-box>

          <j-flex v-if="!isLoading" direction="column" gap="500">
            <div class="app-card" v-for="pkg in packages" :key="pkg.name">
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
        </j-box>

        <j-box mt="500">
          <j-flex direction="row" j="end" gap="300">
            <j-button size="lg" variant="link" @click="() => $emit('cancel')">
              Cancel
            </j-button>
            <j-button
              size="lg"
              :loading="isCreatingChannel"
              :disabled="isCreatingChannel || !canSubmit"
              @click="createChannel"
              variant="primary"
            >
              Create
            </j-button>
          </j-flex>
        </j-box>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { useDataStore } from "@/store/data";
import { defineComponent } from "vue";
import { getAllFluxApps, FluxApp } from "@/utils/npmApi";

export default defineComponent({
  emits: ["cancel", "submit"],
  async created() {
    this.isLoading = true;
    const res = await getAllFluxApps();
    this.isLoading = false;
    this.packages = res;
  },
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    };
  },
  data() {
    return {
      isLoading: false,
      packages: [] as FluxApp[],
      selectedViews: [] as string[],
      channelView: "chat",
      channelName: "",
      isCreatingChannel: false,
    };
  },
  computed: {
    hasName(): boolean {
      return this.channelName?.length >= 3;
    },
    canSubmit(): boolean {
      return this.hasName && this.validSelectedViews;
    },
    selectedApps(): FluxApp[] {
      return this.packages.filter((p) =>
        this.selectedViews.includes(p.packageName)
      );
    },
    validSelectedViews() {
      return this.selectedViews.length >= 1;
    },
  },
  methods: {
    isSelected(pkg: FluxApp) {
      return this.selectedViews.some((view) => view === pkg.packageName);
    },
    toggleView(pkg: FluxApp) {
      const isSelected = this.selectedViews.some(
        (view) => view === pkg.packageName
      );
      this.selectedViews = isSelected
        ? this.selectedViews.filter((n) => n !== pkg.packageName)
        : [...this.selectedViews, pkg.packageName];
    },
    async createChannel() {
      const communityId = this.$route.params.communityId as string;
      const name = this.channelName;
      this.isCreatingChannel = true;
      this.dataStore
        .createChannel({
          perspectiveUuid: communityId,
          name,
          views: this.selectedApps,
        })
        .then((channel: any) => {
          this.$emit("submit");
          this.channelName = "";
          this.$router.push({
            name: "channel",
            params: {
              communityId: communityId.toString(),
              channelId: channel.id,
            },
          });
        })
        .finally(() => {
          this.isCreatingChannel = false;
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
