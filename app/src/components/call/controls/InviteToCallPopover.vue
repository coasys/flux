<template>
  <j-popover ref="popover" placement="top">
    <j-tooltip slot="trigger" placement="top" title="Invite to call">
      <j-button variant="transparent" square circle :size="isMobile ? 'md' : 'lg'">
        <j-icon name="person-plus" :size="isMobile ? 'sm' : 'md'" />
      </j-button>
    </j-tooltip>

    <div slot="content" class="invite-popover">
      <j-flex direction="column" gap="400">
        <j-text nomargin variant="heading-sm" size="400">Invite to call</j-text>

        <j-input
          size="sm"
          placeholder="Search members..."
          type="search"
          :value="searchInput"
          @input="(e: any) => (searchInput = e.target.value)"
        >
          <j-icon name="search" size="xs" slot="start" />
        </j-input>

        <div class="member-list">
          <label
            v-for="member in filteredMembers"
            :key="member.did"
            class="member-row"
            :class="{ selected: selectedDids.has(member.did!) }"
            @click="() => member.did && toggleMember(member.did)"
          >
            <j-avatar size="sm" :did="member.did" :hash="member.did" :src="member.profileThumbnailPicture" />
            <j-text nomargin size="400" style="flex: 1">
              {{ member.username || 'Loading...' }}
            </j-text>
            <j-icon
              v-if="selectedDids.has(member.did!)"
              name="check-circle-fill"
              color="primary-500"
              size="sm"
            />
          </label>

          <j-text v-if="!filteredMembers.length" nomargin size="400" color="ui-400" style="text-align: center; padding: 8px">
            {{ searchInput ? 'No members found' : 'No members to invite' }}
          </j-text>
        </div>

        <j-flex gap="300">
          <j-button size="sm" variant="primary" :disabled="!selectedDids.size" @click="sendInvites">
            <j-icon name="telephone-plus" size="xs" style="margin-right: 4px" />
            Invite {{ selectedDids.size ? `(${selectedDids.size})` : '' }}
          </j-button>
          <j-button size="sm" @click="inviteAll" :disabled="!invitableMembers.length">
            Invite all
          </j-button>
        </j-flex>
      </j-flex>
    </div>
  </j-popover>
</template>

<script setup lang="ts">
import { useAppStore, useWebrtcStore } from '@/stores';
import { useUiStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed, ref, unref, watch } from 'vue';

const appStore = useAppStore();
const webrtcStore = useWebrtcStore();
const uiStore = useUiStore();

const { me } = storeToRefs(appStore);
const { agentsInCall, communityService } = storeToRefs(webrtcStore);
const { isMobile } = storeToRefs(uiStore);

// Resolve members via the community of the active call, not the current route.
// InviteToCallPopover renders inside CallContainer (sibling of RouterView in MainView),
// so Vue inject() cannot reach CommunityView's provider. unref() handles the case
// where Pinia's reactive proxy auto-unwraps the nested members ref.
const members = computed(() => unref(communityService.value?.members) ?? []);
function getMembers() {
  communityService.value?.getMembers();
}

const popover = ref<HTMLElement | null>(null);
const searchInput = ref('');
const selectedDids = ref<Set<string>>(new Set());

// Members who are not already in the call and not the current user
const invitableMembers = computed(() =>
  members.value.filter((m) => {
    if (!m.did || m.did === me.value.did) return false;
    return !agentsInCall.value.some((a) => a.did === m.did);
  }),
);

const filteredMembers = computed(() => {
  if (!searchInput.value) return invitableMembers.value;
  const q = searchInput.value.toLowerCase();
  return invitableMembers.value.filter((m) => {
    const fields = [m.username, m.givenName, m.familyName].filter(Boolean);
    return fields.some((f) => f?.toLowerCase().includes(q));
  });
});

function toggleMember(did: string) {
  const next = new Set(selectedDids.value);
  if (next.has(did)) next.delete(did);
  else next.add(did);
  selectedDids.value = next;
}

function sendInvites() {
  if (!selectedDids.value.size) return;
  webrtcStore.sendCallInvite([...selectedDids.value]);
  selectedDids.value = new Set();
  popover.value?.removeAttribute('open');
}

function inviteAll() {
  const dids = invitableMembers.value.map((m) => m.did!).filter(Boolean);
  if (!dids.length) return;
  webrtcStore.sendCallInvite(dids);
  popover.value?.removeAttribute('open');
}

// Refresh members when popover is opened
watch(
  () => popover.value?.hasAttribute('open'),
  (isOpen) => {
    if (isOpen) {
      getMembers();
      selectedDids.value = new Set();
      searchInput.value = '';
    }
  },
);
</script>

<style scoped lang="scss">
.invite-popover {
  padding: var(--j-space-400);
  min-width: 240px;
  max-width: 300px;
}

.member-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--j-space-200);
}

.member-row {
  display: flex;
  align-items: center;
  gap: var(--j-space-300);
  padding: var(--j-space-200) var(--j-space-300);
  border-radius: var(--j-border-radius);
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--j-color-ui-100);
  }

  &.selected {
    background-color: var(--j-color-primary-50);
  }
}
</style>
