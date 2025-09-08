<template>
  <j-modal :open="modalStore.showEditChannel" @toggle="(e: any) => (modalStore.showEditChannel = e.target.open)">
    <j-box p="800">
      <j-flex direction="column" gap="500">
        <j-text variant="heading-sm">Edit {{ isConversation ? "Conversation" : "Channel" }}</j-text>

        <j-input
          size="lg"
          label="Name"
          :value="name"
          @keydown.enter="updateChannel"
          @input="(e: any) => (name = e.target.value)"
        />

        <j-box pb="500" pt="300">
          <j-box pb="300">
            <j-text variant="label">Select at least one plugin</j-text>
            <j-text size="300" variant="label">
              Can't find a suitable plugin?
              <a target="_blank" style="color: var(--j-color-black)" href="https://docs.fluxsocial.io">Create one</a>
            </j-text>
          </j-box>

          <j-box v-if="isLoading" a="center" p="500">
            <j-spinner />
          </j-box>

          <j-box v-else pb="500">
            <j-tabs class="tabs" :value="tab" @change="(e: any) => (tab = e.target.value)">
              <j-tab-item value="official">Official</j-tab-item>
              <j-tab-item value="community">Community</j-tab-item>
            </j-tabs>
          </j-box>

          <j-flex v-if="!isLoading" direction="column" gap="500">
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
                    :variant="isSelected(app.pkg) && loadedPlugins[app.pkg] === 'loaded' ? '' : 'primary'"
                    :loading="loadedPlugins[app.pkg] === 'loading'"
                    @click="() => toggleView(app)"
                  >
                    {{ isSelected(app.pkg) && loadedPlugins[app.pkg] === "loaded" ? "Remove" : "Add" }}
                  </j-button>
                </div>
              </j-flex>
            </div>
          </j-flex>
        </j-box>

        <j-box mt="500">
          <j-flex direction="row" j="end" gap="300">
            <j-button size="lg" variant="link" @click="modalStore.showEditChannel = false"> Cancel </j-button>
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
  </j-modal>
</template>

<script setup lang="ts">
import { useCommunityService } from "@/composables/useCommunityService";
import { useModalStore } from "@/stores";
import fetchFluxApp from "@/utils/fetchFluxApp";
import { useModel } from "@coasys/ad4m-vue-hooks";
import {
  App,
  Channel,
  Conversation,
  FluxApp,
  generateWCName,
  getAllFluxApps,
  getOfflineFluxApps,
} from "@coasys/flux-api";
import semver from "semver";
import { computed, onMounted, reactive, ref, toRaw, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const modalStore = useModalStore();

const {
  perspective,
  recentConversations,
  getPinnedConversations,
  getRecentConversations,
  getChannelsWithConversations,
} = useCommunityService();

const tab = ref<"official" | "community">("official");
const isLoading = ref(false);
const packages = ref<FluxApp[]>([]);
const loadedPlugins = reactive<Record<string, "loaded" | "loading" | undefined | null>>({});
const name = ref("");
const selectedPlugins = ref<App[]>([]);
const isSaving = ref(false);

const channelId = computed(() => route.params.channelId as string);
const channel = computed(() => channels.value?.[0] || null);
const isConversation = computed(() => channel.value?.isConversation);
const canSave = computed(() => selectedPlugins.value.length >= 1);
const officialApps = computed(() =>
  packages.value.filter(
    // TODO: WebRTC & Synergy filtered out for now, remove plugins from codebase when fully replaced in main app?
    (p) =>
      p.pkg.startsWith("@coasys/") && !["@coasys/flux-webrtc-view", "@coasys/flux-synergy-demo-view"].includes(p.pkg)
  )
);
const communityApps = computed((): FluxApp[] => packages.value.filter((p) => !p.pkg.startsWith("@coasys/")));
const filteredPackages = computed((): FluxApp[] =>
  tab.value === "official" ? officialApps.value : communityApps.value
);

const { entries: channels } = useModel({ perspective, model: Channel, query: { where: { base: channelId.value } } });
const { entries: apps } = useModel({ perspective, model: App, query: { source: channelId.value } });

function toggleView(app: FluxApp) {
  const isSelectedApp = selectedPlugins.value.some((a) => a.pkg === app.pkg);

  selectedPlugins.value = isSelectedApp
    ? selectedPlugins.value.filter((a) => a.pkg !== app.pkg)
    : [...selectedPlugins.value, app as any];

  // Preload view when selected to remove loading on submit
  if (!isSelectedApp) fetchFluxApp(app.pkg);
}

function isSelected(pkg: string) {
  return selectedPlugins.value.some((app) => app.pkg === pkg);
}

async function updateChannel() {
  isSaving.value = true;

  try {
    const removeApps = apps.value
      .filter((app) => !selectedPlugins.value.some((a) => a.pkg === app.pkg))
      .map((app) => {
        const appModel = new App(perspective, app.baseExpression);
        return appModel.delete();
      });

    await Promise.all(removeApps);

    const addedApps = selectedPlugins.value
      .filter((app) => !apps.value.some((a) => a.pkg === app.pkg))
      .map((app) => {
        const appModel = new App(perspective, undefined, channelId.value);
        appModel.name = app.name;
        appModel.description = app.description;
        appModel.icon = app.icon;
        appModel.pkg = app.pkg;
        return appModel.save();
      });

    await Promise.all(addedApps);

    if (isConversation.value) {
      // Update the assosiated conversation name
      const conversationData = recentConversations.value.find(
        (c) => c.channel.baseExpression === channel.value.baseExpression
      );
      const conversationId = toRaw(conversationData?.conversation)?.baseExpression;
      if (!conversationId) return;
      const conversationModel = new Conversation(perspective, conversationId);
      conversationModel.conversationName = name.value;
      await conversationModel.update();
      // Refresh sidebar channels
      getPinnedConversations();
      getRecentConversations();
      getChannelsWithConversations();
    } else {
      // Update the channel name directly
      const channelModel = new Channel(perspective, channelId.value);
      channelModel.name = name.value;
      await channelModel.update();
    }
  } finally {
    isSaving.value = false;
    modalStore.showEditChannel = false;
  }
}

watch(
  apps,
  (newApps) => {
    if (newApps) selectedPlugins.value = newApps;
  },
  { deep: true, immediate: true }
);

watch(
  channel,
  (newChannel) => {
    if (newChannel) {
      if (newChannel.isConversation) {
        // Get the conversation name for the channel
        const conversationData = recentConversations.value.find(
          (c) => c.channel.baseExpression === newChannel.baseExpression
        );
        name.value = conversationData?.conversation?.conversationName || "";
      } else {
        // Otherwise just use the channel name
        name.value = newChannel.name;
      }
    }
  },
  { deep: true }
);

watch(
  selectedPlugins,
  async (newApps: any[]) => {
    newApps?.forEach(async (app) => {
      const wcName = await generateWCName(app.pkg);
      if (customElements.get(wcName)) {
        loadedPlugins[app.pkg] = "loaded";
      } else {
        loadedPlugins[app.pkg] = "loading";

        const module = await fetchFluxApp(app.pkg);
        if (module) {
          customElements.define(wcName, module.default);
        }

        loadedPlugins[app.pkg] = "loaded";
      }
    });
  },
  { deep: true, immediate: true }
);

onMounted(async () => {
  isLoading.value = true;

  // Fetch apps from npm, use local apps if request fails
  try {
    const res = await getAllFluxApps();
    isLoading.value = false;

    const filtered = res.filter((pkg) => {
      try {
        const version = semver.coerce(pkg?.ad4mVersion || "0.0.0");
        return version ? semver.gte(version, "0.8.1") : false;
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
</script>

<style scoped>
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
