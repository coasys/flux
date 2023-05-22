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
        <div class="app-card" v-for="app in packages" :key="app.name">
          <j-box pb="500">
            <j-badge
              size="sm"
              v-if="app.pkg.startsWith('@fluxapp')"
              variant="success"
            >
              Official App
            </j-badge>
          </j-box>
          <j-flex a="center" j="between">
            <j-flex gap="500" a="center" j="center">
              <j-icon size="lg" v-if="app.icon" :name="app.icon"></j-icon>
              <div>
                <j-text variant="heading-sm">
                  {{ app.name }}
                </j-text>
                <j-text nomargin>
                  {{ app.description }}
                </j-text>
              </div>
            </j-flex>
            <div>
              <j-button
                :variant="isSelected(app.pkg) ? 'subtle' : 'primary'"
                @click="() => toggleView(app)"
              >
                {{ isSelected(app.pkg) ? "Remove" : "Add" }}
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
import { App, Channel, getAllFluxApps, FluxApp } from "@fluxapp/api";
import ChannnelViewOptions from "@/components/channel-view-options/ChannelViewOptions.vue";
import { viewOptions } from "@/constants";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { useEntries, useEntry, usePerspective } from "@fluxapp/vue";
import { useRoute } from "vue-router";

export default defineComponent({
  props: ["channelId"],
  emits: ["cancel", "submit"],
  components: { ChannnelViewOptions },
  async created() {
    this.isLoading = true;
    const res = await getAllFluxApps();
    this.isLoading = false;
    this.packages = res.filter(
      (pkg) => new Date(pkg.created) > new Date("05-01-2023")
    );
  },
  async setup(props) {
    const route = useRoute();
    const client = await getAd4mClient();
    const { data } = usePerspective(client, () => route.params.communityId);

    const { entry: channel, repo } = useEntry({
      perspective: () => data.value.perspective,
      id: props.channelId,
      model: Channel,
    });

    const { entries: apps, repo: appRepo } = useEntries({
      perspective: () => data.value.perspective,
      source: () => props.channelId,
      model: App,
    });

    return {
      repo,
      apps,
      appRepo,
      channel,
      isLoading: ref(false),
      packages: ref<FluxApp[]>([]),
      name: ref(""),
      description: ref(""),
      selectedViews: ref<App[]>([]),
      isSaving: ref(false),
      appStore: useAppStore(),
    };
  },
  computed: {
    canSave() {
      return this.selectedViews.length >= 1;
    },
    viewOptions() {
      return viewOptions;
    },
  },
  watch: {
    apps: {
      handler: async function (apps) {
        if (apps) {
          this.selectedViews = apps;
        }
      },
      deep: true,
      immediate: true,
    },
    channel: {
      handler: async function (channel) {
        if (channel) {
          this.name = channel.name;
          this.description = channel.description;
        }
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    toggleView(app: App) {
      const isSelected = this.selectedViews.some((a) => a.pkg === app.pkg);

      this.selectedViews = isSelected
        ? this.selectedViews.filter((a) => a.pkg !== app.pkg)
        : [...this.selectedViews, app];
    },
    isSelected(pkg: any) {
      return this.selectedViews.some((app) => app.pkg === pkg);
    },
    async updateChannel() {
      this.isSaving = true;

      try {
        console.log("selected views", this.selectedViews, this.apps);

        const removeApps = this.apps
          .filter((app) => !this.selectedViews.some((a) => a.pkg === app.pkg))
          .map((app) => {
            return this.appRepo?.remove(app.id);
          });

        await Promise.all(removeApps);

        const newApps = this.selectedViews.map((app) => {
          this.appRepo?.create(
            {
              name: app.name,
              description: app.description,
              icon: app.icon,
              pkg: app.pkg,
            },
            app.pkg
          );
        });

        await Promise.all(newApps);

        await this.repo?.update(this.$route.params.channelId as string, {
          name: this.name,
        });

        this.$emit("submit");
      } finally {
        this.isSaving = false;
      }
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
