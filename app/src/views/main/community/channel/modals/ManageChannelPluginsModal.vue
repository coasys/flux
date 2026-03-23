<template>
  <j-modal
    :open="modalStore.showManageChannelPluginsModal"
    @toggle="(e: any) => (modalStore.showManageChannelPluginsModal = e.target.open)"
  >
    <j-box p="800">
      <j-flex direction="column" gap="500">
        <j-text size="700" weight="600" color="primary-700" nomargin>
          Manage {{ isConversation ? 'Conversation' : 'Channel' }} Plugins
        </j-text>

        <j-box pb="500">
          <j-box pb="300">
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
                    {{ isSelected(app.pkg) && loadedPlugins[app.pkg] === 'loaded' ? 'Remove' : 'Add' }}
                  </j-button>
                </div>
              </j-flex>
            </div>
          </j-flex>
        </j-box>

        <j-box mt="500">
          <j-flex direction="row" j="end" gap="300">
            <j-button size="lg" variant="link" @click="modalStore.showManageChannelPluginsModal = false">
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
  </j-modal>
</template>

<script setup lang="ts">
import { useCommunityService } from '@/composables/useCommunityService';
import { useModalStore } from '@/stores';
import fetchFluxApp from '@/utils/fetchFluxApp';
import { restoreChannelPrefix } from '@/utils/routeUtils';
import { App, Channel, FluxApp, generateWCName, getAllFluxApps, getOfflineFluxApps } from '@coasys/flux-api';
import { Link } from '@coasys/ad4m';
import semver from 'semver';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const modalStore = useModalStore();
const { perspective, recentConversationsWithAgents: recentConversations, allChannels } = useCommunityService();

const tab = ref<'official' | 'community'>('official');
const isLoading = ref(false);
const packages = ref<FluxApp[]>([]);
const loadedPlugins = reactive<Record<string, 'loaded' | 'loading' | undefined | null>>({});
const name = ref('');
const selectedPlugins = ref<App[]>([]);
const isSaving = ref(false);

const channelId = computed(() => route.params.channelId as string);
const channelUrl = computed(() => restoreChannelPrefix(channelId.value));
const channel = computed(() => allChannels.value.find((c) => c.id === channelUrl.value) || null);
const isConversation = computed(() => channel.value?.isConversation);
const canSave = computed(() => selectedPlugins.value.length >= 1);
const officialApps = computed(() =>
  packages.value.filter(
    // TODO: WebRTC & Synergy filtered out for now, remove plugins from codebase when fully replaced in main app?
    (p) =>
      p.pkg.startsWith('@coasys/') && !['@coasys/flux-webrtc-view', '@coasys/flux-synergy-demo-view'].includes(p.pkg),
  ),
);
const communityApps = computed((): FluxApp[] => packages.value.filter((p) => !p.pkg.startsWith('@coasys/')));
const filteredPackages = computed((): FluxApp[] =>
  tab.value === 'official' ? officialApps.value : communityApps.value,
);

const views = ref<App[]>([]);
watch(
  channel,
  async (newChannel) => {
    if (newChannel) {
      await newChannel.get({ views: true });
      views.value = newChannel.views;
      selectedPlugins.value = newChannel.views;
    } else {
      views.value = [];
    }
  },
  { immediate: true },
);

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
    const removeApps = views.value
      .filter((app) => !selectedPlugins.value.some((a) => a.pkg === app.pkg))
      .map((app) => {
        const appModel = new App(perspective, app.id);
        return appModel.delete();
      });

    await Promise.all(removeApps);

    const addedApps = selectedPlugins.value
      .filter((app) => !views.value.some((a) => a.pkg === app.pkg))
      .map(async (app) => {
        const appModel = new App(perspective);
        appModel.name = app.name;
        appModel.description = app.description;
        appModel.icon = app.icon;
        appModel.pkg = app.pkg;
        await appModel.save();
        await perspective.add(new Link({ source: channelUrl.value, predicate: 'ad4m://has_child', target: appModel.id }));
      });

    await Promise.all(addedApps);
  } finally {
    isSaving.value = false;
    modalStore.showManageChannelPluginsModal = false;
  }
}

watch(
  channel,
  (newChannel) => {
    if (newChannel) {
      if (newChannel.isConversation) {
        // Get the conversation name for the channel
        const conversationData = recentConversations.value.find((c) => c.channel?.id === newChannel.id);
        name.value = conversationData?.conversation?.conversationName || '';
      } else {
        // Otherwise just use the channel name
        name.value = newChannel.name;
      }
    }
  },
  { deep: true },
);

watch(
  selectedPlugins,
  async (newApps: any[]) => {
    newApps?.forEach(async (app) => {
      const wcName = await generateWCName(app.pkg);
      if (customElements.get(wcName)) {
        loadedPlugins[app.pkg] = 'loaded';
      } else {
        loadedPlugins[app.pkg] = 'loading';

        const module = await fetchFluxApp(app.pkg);
        if (module && !customElements.get(wcName)) {
          customElements.define(wcName, module.default);
        }

        loadedPlugins[app.pkg] = 'loaded';
      }
    });
  },
  { deep: true, immediate: true },
);

onMounted(async () => {
  isLoading.value = true;

  // Fetch apps from npm, use local apps if request fails
  try {
    const res = await getAllFluxApps();
    isLoading.value = false;

    const filtered = res.filter((pkg) => {
      try {
        const version = semver.coerce(pkg?.ad4mVersion || '0.0.0');
        return version ? semver.gte(version, '0.8.1') : false;
      } catch (error) {
        return false;
      }
    });

    packages.value = filtered;
  } catch (error) {
    console.info('Flux is offline, using fallback apps');
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
