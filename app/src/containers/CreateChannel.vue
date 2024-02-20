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
            <j-text variant="label">Select at least one plugin</j-text>
            <j-text size="300" variant="label">
              Can't find a suitable plugin?
              <a
                target="_blank"
                style="color: var(--j-color-black)"
                href="https://docs.fluxsocial.io"
                >Create one</a
              >
            </j-text>
          </j-box>

          <j-box v-if="isLoading" align="center" p="500">
            <j-spinner></j-spinner>
          </j-box>

          <j-box v-else pb="500">
            <j-tabs
              class="tabs"
              :value="tab"
              @change="(e) => (tab = e.target.value)"
            >
              <j-tab-item value="official">Official</j-tab-item>
              <j-tab-item value="community">Community</j-tab-item>
            </j-tabs>
          </j-box>

          <div class="app-grid" v-if="!isLoading">
            <div
              class="app-card"
              v-for="app in filteredPackages"
              :key="app.name"
            >
              <j-flex a="center" direction="row" j="between" gap="500">
                <j-flex gap="500" a="center" j="center">
                  <j-icon size="lg" v-if="app.icon" :name="app.icon"></j-icon>
                  <div>
                    <j-flex gap="300">
                      <j-text variant="heading-sm">
                        {{ app.name }}
                      </j-text>
                      <j-badge
                        size="sm"
                        v-if="app.pkg.startsWith('@coasys')"
                        variant="success"
                      >
                        Official App
                      </j-badge>
                    </j-flex>
                    <j-text nomargin>
                      {{ app.description }}
                    </j-text>
                  </div>
                </j-flex>
                <div>
                  <j-button
                    :loading="loadedPlugins[app.pkg] === 'loading'"
                    :variant="
                      isSelected(app) && loadedPlugins[app.pkg] === 'loaded'
                        ? 'link'
                        : 'primary'
                    "
                    @click="() => toggleView(app)"
                  >
                    {{ isSelected(app) ? "Remove" : "Add" }}
                  </j-button>
                </div>
              </j-flex>
            </div>
          </div>
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
import { ref } from "vue";
import { useRoute } from "vue-router";
import {
  Channel,
  getAllFluxApps,
  FluxApp,
  App,
  generateWCName,
  getOfflineFluxApps,
} from "@coasys/flux-api";
import semver from "semver";
import { usePerspective, useSubject } from "@coasys/ad4m-vue-hooks";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import { defineComponent } from "vue";
import fetchFluxApp from "@/utils/fetchFluxApp";
import { dependencies } from "../../package.json";

export default defineComponent({
  emits: ["cancel", "submit"],
  async created() {
    this.isLoading = true;

    // Fetch apps from npm, use local apps if request fails
    try {
      const res = await getAllFluxApps();

      this.isLoading = false;
      const filtered = res.filter((pkg) =>
        semver.gte(pkg.ad4mVersion || "0.0.0", dependencies["@coasys/ad4m"])
      );
      
      this.packages = filtered;
    } catch (error) {
      console.info("Flux is offline, using fallback apps");

      const offlineApps = await getOfflineFluxApps();
      this.packages = offlineApps;
      this.isLoading = false;
    }
  },
  async setup() {
    const route = useRoute();

    const client = await getAd4mClient();

    const { data } = usePerspective(client, () => route.params.communityId);

    const { repo } = useSubject({
      perspective: () => data.value.perspective,
      subject: Channel,
    });

    const { repo: appRepo } = useSubject({
      perspective: () => data.value.perspective,
      subject: App,
    });

    return {
      appRepo,
      repo,
    };
  },
  data() {
    return {
      tab: ref<"official" | "community">("official"),
      isLoading: false,
      packages: [] as FluxApp[],
      selectedViews: [] as string[],
      loadedPlugins: {} as Record<
        string,
        "loaded" | "loading" | undefined | null
      >,
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
    selectedPlugins(): FluxApp[] {
      return this.packages.filter((p) => this.selectedViews.includes(p.pkg));
    },
    officialApps(): FluxApp[] {
      return this.packages.filter((p) => p.pkg.startsWith("@coasys/"));
    },
    communityApps(): FluxApp[] {
      return this.packages.filter((p) => !p.pkg.startsWith("@coasys/"));
    },
    filteredPackages(): FluxApp[] {
      return this.tab === "official" ? this.officialApps : this.communityApps;
    },
    validSelectedViews() {
      return this.selectedViews.length >= 1;
    },
  },
  watch: {
    selectedPlugins: {
      handler: async function (apps: FluxApp[]) {
        apps?.forEach(async (app) => {
          const wcName = await generateWCName(app.pkg);
          if (customElements.get(wcName)) {
            this.loadedPlugins[app.pkg] = "loaded";
          } else {
            this.loadedPlugins[app.pkg] = "loading";
            const module = await fetchFluxApp(app.pkg);
            if (module) {
              customElements.define(wcName, module.default);
            }

            this.loadedPlugins[app.pkg] = "loaded";
            this.$forceUpdate();
          }
        });
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    isSelected(pkg: FluxApp) {
      return this.selectedViews.some((view) => view === pkg.pkg);
    },
    toggleView(pkg: FluxApp) {
      const isSelected = this.selectedViews.some((view) => view === pkg.pkg);
      this.selectedViews = isSelected
        ? this.selectedViews.filter((n) => n !== pkg.pkg)
        : [...this.selectedViews, pkg.pkg];

      // Preload view when selected to remove loading on submit
      if (!isSelected) {
        fetchFluxApp(pkg.pkg);
      }
    },
    async createChannel() {
      const communityId = this.$route.params.communityId as string;
      const name = this.channelName;
      this.isCreatingChannel = true;

      try {
        const channel = await this.repo?.create({
          name,
        });

        const promises = this.selectedPlugins.map(async (app) => {
          return this.appRepo?.create(
            {
              name: app.name,
              description: app.description,
              icon: app.icon,
              pkg: app.pkg,
            },
            app.pkg,
            channel.id
          );
        });

        await Promise.all(promises);

        this.$emit("submit");
        this.channelName = "";
        this.$router.push({
          name: "channel",
          params: {
            communityId: communityId.toString(),
            channelId: channel.id,
          },
        });
      } finally {
        this.isCreatingChannel = false;
      }
    },
  },
});
</script>

<style scoped>
.app-grid {
  width: 100%;
  gap: var(--j-space-400);
  display: grid;
  grid-template-columns: 1fr;
}
.app-card {
  padding: var(--j-space-500);
  border-radius: var(--j-border-radius);
  background: var(--j-color-ui-50);
  border: 1px solid var(--j-color-ui-100);
}

j-tabs::part(base) {
  gap: var(--j-space-500);
}

j-tab-item::part(base) {
  padding: 0;
}
</style>
