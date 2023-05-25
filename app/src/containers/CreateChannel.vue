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

          <div class="app-grid" v-if="!isLoading">
            <div class="app-card" v-for="pkg in packages" :key="pkg.name">
              <j-flex a="center" direction="row" j="between" gap="500">
                <j-flex gap="500" a="center" j="center">
                  <j-icon size="lg" v-if="pkg.icon" :name="pkg.icon"></j-icon>
                  <div>
                    <j-flex gap="300">
                      <j-text variant="heading-sm">
                        {{ pkg.name }}
                      </j-text>
                      <j-badge
                        size="sm"
                        v-if="pkg.pkg.startsWith('@fluxapp')"
                        variant="success"
                      >
                        Official App
                      </j-badge>
                    </j-flex>
                    <j-text nomargin>
                      {{ pkg.description }}
                    </j-text>
                  </div>
                </j-flex>
                <div>
                  <j-button
                    :variant="isSelected(pkg) ? 'secondary' : 'primary'"
                    @click="() => toggleView(pkg)"
                  >
                    {{ isSelected(pkg) ? "Remove" : "Install" }}
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
import { useRoute } from "vue-router";
import { Channel, getAllFluxApps, FluxApp, App } from "@fluxapp/api";
import { usePerspective, useEntry } from "@fluxapp/vue";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["cancel", "submit"],
  async created() {
    this.isLoading = true;
    const res = await getAllFluxApps();

    this.isLoading = false;
    const filtered = res.filter(
      (pkg) => new Date(pkg.created) > new Date("2023-05-01")
    );
    this.packages = filtered;
    console.log({ packages: filtered, res });
  },
  async setup() {
    const route = useRoute();

    const client = await getAd4mClient();

    const { data } = usePerspective(client, () => route.params.communityId);

    const { repo } = useEntry({
      perspective: () => data.value.perspective,
      model: Channel,
    });

    const { repo: appRepo } = useEntry({
      perspective: () => data.value.perspective,
      model: App,
    });

    return {
      appRepo,
      repo,
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
      return this.packages.filter((p) => this.selectedViews.includes(p.pkg));
    },
    validSelectedViews() {
      return this.selectedViews.length >= 1;
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
    },
    async createChannel() {
      const communityId = this.$route.params.communityId as string;
      const name = this.channelName;
      this.isCreatingChannel = true;

      try {
        const channel = await this.repo?.create({
          name,
        });

        const promises = this.selectedApps.map(async (app) => {
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
</style>
