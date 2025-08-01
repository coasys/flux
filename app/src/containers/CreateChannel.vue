<template>
  <j-box p="800">
    <j-flex direction="column" gap="700">
      <div>
        <j-text v-if="createChannelParent" variant="heading-sm">
          Create a sub-channel in #{{ createChannelParent.name }}
        </j-text>
        <j-text v-else variant="heading-sm">Create Channel</j-text>
        <j-text variant="body"> Channels are ways to organize your conversations by topics. </j-text>
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
          @input="(e: any) => (channelName = e.target.value)"
        />

        <j-input
          size="lg"
          label="Description"
          :minlength="10"
          :maxlength="300"
          autovalidate
          type="text"
          :value="channelDescription"
          @input="(e: any) => (channelDescription = e.target.value)"
        />

        <j-box pb="500" pt="300">
          <j-box pb="300">
            <j-text variant="label">Select at least one plugin</j-text>
            <j-text size="300" variant="label">
              Can't find a suitable plugin?
              <a target="_blank" style="color: var(--j-color-black)" href="https://docs.fluxsocial.io">Create one</a>
            </j-text>
          </j-box>

          <j-box v-if="isLoading" p="500">
            <j-spinner />
          </j-box>

          <j-box v-else pb="500">
            <j-tabs class="tabs" :value="tab" @change="(e: any) => (tab = e.target.value)">
              <j-tab-item value="official">Official</j-tab-item>
              <j-tab-item value="community">Community</j-tab-item>
            </j-tabs>
          </j-box>

          <div class="app-grid" v-if="!isLoading">
            <div class="app-card" v-for="app in filteredPackages" :key="app.name">
              <j-flex a="center" direction="row" j="between" gap="500">
                <j-flex gap="500" a="center" j="center">
                  <j-icon size="lg" v-if="app.icon" :name="app.icon"></j-icon>
                  <div>
                    <j-flex gap="300">
                      <j-text variant="heading-sm">
                        {{ app.name }}
                      </j-text>
                      <j-badge size="sm" v-if="app.pkg.startsWith('@coasys')" variant="success"> Official App </j-badge>
                    </j-flex>
                    <j-text nomargin>
                      {{ app.description }}
                    </j-text>
                  </div>
                </j-flex>
                <div>
                  <j-button
                    :loading="loadedPlugins[app.pkg] === 'loading'"
                    :variant="isSelected(app) && loadedPlugins[app.pkg] === 'loaded' ? '' : 'primary'"
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
            <j-button size="lg" variant="link" @click="emit('cancel')"> Cancel </j-button>
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

<script setup lang="ts">
import { useModalStore } from "@/stores";
import fetchFluxApp from "@/utils/fetchFluxApp";
import { getAd4mClient } from "@coasys/ad4m-connect";
import { usePerspective } from "@coasys/ad4m-vue-hooks";
import { App, Channel, FluxApp, generateWCName, getAllFluxApps, getOfflineFluxApps } from "@coasys/flux-api";
import { storeToRefs } from "pinia";
import semver from "semver";
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const emit = defineEmits<{ cancel: []; submit: [] }>();

const route = useRoute();
const router = useRouter();
const modalStore = useModalStore();

const { createChannelParent } = storeToRefs(modalStore);

const tab = ref<"official" | "community">("official");
const isLoading = ref(false);
const packages = ref<FluxApp[]>([]);
const selectedViews = ref<string[]>([]);
const loadedPlugins = reactive<Record<string, "loaded" | "loading" | undefined | null>>({});
const channelName = ref("");
const channelDescription = ref("");
const isCreatingChannel = ref(false);

const client = await getAd4mClient();
const { data } = usePerspective(client, () => route.params.communityId);
const perspective = computed(() => data.value.perspective);

const hasName = computed(() => channelName.value?.length >= 3);
const canSubmit = computed(() => hasName.value);
const selectedPlugins = computed(() => packages.value.filter((p) => selectedViews.value.includes(p.pkg)));
const officialApps = computed(() =>
  packages.value.filter(
    // TODO: WebRTC & Synergy filtered out for now, remove plugins from codebase when fully replaced in main app?
    (p) =>
      p.pkg.startsWith("@coasys/") && !["@coasys/flux-webrtc-view", "@coasys/flux-synergy-demo-view"].includes(p.pkg)
  )
);
const communityApps = computed(() => packages.value.filter((p) => !p.pkg.startsWith("@coasys/")));
const filteredPackages = computed(() => (tab.value === "official" ? officialApps.value : communityApps.value));

function isSelected(pkg: FluxApp) {
  return selectedViews.value.some((view) => view === pkg.pkg);
}

function toggleView(pkg: FluxApp) {
  const isSelected = selectedViews.value.some((view) => view === pkg.pkg);
  selectedViews.value = isSelected
    ? selectedViews.value.filter((n) => n !== pkg.pkg)
    : [...selectedViews.value, pkg.pkg];
}

async function createChannel() {
  const communityId = route.params.communityId as string;
  isCreatingChannel.value = true;

  try {
    if (!perspective.value) {
      throw new Error("Cannot create a channel because perspective is undefined.");
    }

    console.log("creating channel: ", createChannelParent.value?.baseExpression);

    const channel = new Channel(perspective.value, undefined, createChannelParent.value?.baseExpression || undefined);
    channel.name = channelName.value;
    channel.description = channelDescription.value;
    channel.isConversation = false;
    channel.isPinned = false;
    await channel.save();

    await Promise.all(
      selectedPlugins.value.map(async (app) => {
        const appInstance = new App(perspective.value!, undefined, channel.baseExpression);
        appInstance.name = app.name;
        appInstance.description = app.description;
        appInstance.icon = app.icon;
        appInstance.pkg = app.pkg;
        await appInstance.save();
      })
    );

    emit("submit");
    channelName.value = "";

    if (!createChannelParent.value) {
      router.push({
        name: "channel",
        params: {
          communityId: communityId.toString(),
          channelId: channel.baseExpression,
        },
      });
    }
  } finally {
    createChannelParent.value = null;
    isCreatingChannel.value = false;
  }
}

// Watch selectedPlugins for loading behavior
watch(
  selectedPlugins,
  async (apps: FluxApp[]) => {
    apps?.forEach(async (app) => {
      const wcName = await generateWCName(app.pkg);
      if (customElements.get(wcName)) loadedPlugins[app.pkg] = "loaded";
      else {
        loadedPlugins[app.pkg] = "loading";
        const module = await fetchFluxApp(app.pkg);
        if (module) customElements.define(wcName, module.default);
        loadedPlugins[app.pkg] = "loaded";
      }
    });
  },
  { deep: true, immediate: true }
);

// Initialize data on mount
onMounted(async () => {
  isLoading.value = true;

  // Fetch apps from npm, use local apps if request fails
  try {
    const res = await getAllFluxApps();
    isLoading.value = false;

    const filtered = res.filter((pkg) => {
      try {
        return semver.gte(semver.coerce(pkg?.ad4mVersion || "0.0.0") || "0.0.0", "0.8.1");
      } catch (error) {
        return false;
      }
    });

    packages.value = filtered;
  } catch (error) {
    console.info("Flux is offline, using fallback apps");
    const offlineApps = await getOfflineFluxApps();
    packages.value = offlineApps;
    isLoading.value = false;
  }
});

onUnmounted(modalStore.hideCreateChannelModal);
</script>

<style scoped>
.app-grid {
  width: 100%;
  gap: var(--j-space-400);
  display: grid;
  grid-template-columns: 1fr;
  max-height: 600px;
  overflow-y: auto;
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
