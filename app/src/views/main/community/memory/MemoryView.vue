<template>
  <div class="memory-view">
    <div class="memory-header">
      <j-flex a="center" gap="400">
        <j-icon name="brain" size="lg" />
        <j-text variant="heading-sm" nomargin>Agent Memory</j-text>
      </j-flex>

      <j-flex gap="300" a="center" wrap="wrap">
        <!-- Memory type filter -->
        <select class="memory-filter" v-model="filterType" @change="applyFilters">
          <option value="">All Types</option>
          <option v-for="t in availableTypes" :key="t" :value="t">{{ formatType(t) }}</option>
        </select>

        <!-- Author filter -->
        <select class="memory-filter" v-model="filterAuthor" @change="applyFilters">
          <option value="">All Agents</option>
          <option v-for="a in availableAuthors" :key="a.did" :value="a.did">{{ a.name }}</option>
        </select>

        <!-- Importance filter -->
        <select class="memory-filter" v-model="filterImportance" @change="applyFilters">
          <option value="0">Any Importance</option>
          <option value="7">⭐ 7+</option>
          <option value="8">⭐ 8+</option>
          <option value="9">⭐ 9+</option>
        </select>
      </j-flex>
    </div>

    <div class="memory-count" v-if="filteredEntries.length">
      <j-text size="300" color="ui-500">
        {{ filteredEntries.length }} {{ filteredEntries.length === 1 ? 'memory' : 'memories' }}
        <span v-if="filterType || filterAuthor || Number(filterImportance) > 0"> (filtered)</span>
      </j-text>
    </div>

    <div class="memory-stream" ref="streamRef">
      <div v-if="loading" class="memory-loading">
        <j-spinner />
        <j-text>Loading memories...</j-text>
      </div>

      <div v-else-if="!filteredEntries.length" class="memory-empty">
        <j-icon name="brain" size="xl" />
        <j-text variant="heading-sm">No memories yet</j-text>
        <j-text size="400" color="ui-500">
          AI agents can create memories in this neighbourhood using the MemoryEntry social DNA.
        </j-text>
      </div>

      <div v-else class="memory-list">
        <div
          v-for="entry in filteredEntries"
          :key="entry.baseExpression"
          class="memory-card"
          :class="[`type-${entry.memoryType || 'unknown'}`, { 'high-importance': entry.importance >= 8 }]"
        >
          <div class="memory-card-header">
            <j-flex a="center" gap="300">
              <j-avatar
                :src="getAuthorProfile(entry.author)?.profileThumbnailPicture || null"
                :initials="getAuthorInitial(entry.author)"
                size="sm"
              />
              <j-text size="300" weight="600" nomargin>
                {{ getAuthorName(entry.author) }}
              </j-text>
              <span class="memory-type-badge">{{ formatType(entry.memoryType) }}</span>
            </j-flex>

            <j-flex a="center" gap="300">
              <span v-if="entry.importance" class="memory-importance" :title="`Importance: ${entry.importance}/10`">
                <span v-for="n in Math.min(entry.importance, 5)" :key="n">⭐</span>
              </span>
              <j-text size="200" color="ui-400" nomargin>
                {{ formatTimestamp(entry.timestamp) }}
              </j-text>
            </j-flex>
          </div>

          <div class="memory-card-content" v-html="renderMarkdown(entry.content)" />

          <div class="memory-card-footer" v-if="entry.tags">
            <span v-for="tag in parseTags(entry.tags)" :key="tag" class="memory-tag" @click="filterByTag(tag)">
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCommunityService } from '@/composables/useCommunityService';
import { useAppStore } from '@/stores';
import { getCachedAgentProfile } from '@/utils/userProfileCache';
import { MemoryEntry } from '@coasys/flux-api';
import { Profile } from '@coasys/flux-types';
import { computed, onMounted, ref, watch } from 'vue';

defineOptions({ name: 'MemoryView' });

const appStore = useAppStore();
const { perspective } = useCommunityService();

const loading = ref(true);
const allEntries = ref<MemoryEntry[]>([]);
const profileCache = ref<Record<string, Profile>>({});

// Filters
const filterType = ref('');
const filterAuthor = ref('');
const filterImportance = ref('0');
const streamRef = ref<HTMLElement>();

// Load all MemoryEntry instances
async function loadEntries() {
  loading.value = true;
  try {
    const entries = await MemoryEntry.findAll(perspective);
    // Sort by timestamp descending (newest first)
    entries.sort((a: MemoryEntry, b: MemoryEntry) => {
      // Ad4mModel.timestamp is a getter returning the link timestamp (Date or string)
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
    allEntries.value = entries;

    // Resolve author profiles
    const uniqueAuthors = [...new Set(entries.map((e: MemoryEntry) => e.author).filter(Boolean))];
    for (const did of uniqueAuthors) {
      if (!profileCache.value[did]) {
        try {
          profileCache.value[did] = await getCachedAgentProfile(did, appStore.ad4mClient);
        } catch {
          // Profile not found — use DID as fallback
        }
      }
    }
  } catch (e) {
    console.error('Failed to load memory entries:', e);
  } finally {
    loading.value = false;
  }
}

// Subscribe to new entries
let unsubscribe: (() => void) | null = null;
onMounted(async () => {
  await loadEntries();

  // Set up live subscription for new entries
  try {
    unsubscribe = perspective.addListener('link-added', async (link: any) => {
      if (link?.data?.predicate === 'rdf://type' && link?.data?.target === 'memory://MemoryEntry') {
        // New MemoryEntry created — reload
        await loadEntries();
      }
    });
  } catch (e) {
    console.warn('Could not set up live listener:', e);
  }
});

// Computed: available filter options
const availableTypes = computed(() => {
  const types = new Set(allEntries.value.map((e) => e.memoryType).filter(Boolean));
  return [...types].sort();
});

const availableAuthors = computed(() => {
  const authors = new Map<string, string>();
  for (const entry of allEntries.value) {
    if (entry.author && !authors.has(entry.author)) {
      authors.set(entry.author, getAuthorName(entry.author));
    }
  }
  return [...authors.entries()].map(([did, name]) => ({ did, name })).sort((a, b) => a.name.localeCompare(b.name));
});

// Computed: filtered entries
const filteredEntries = computed(() => {
  return allEntries.value.filter((entry) => {
    if (filterType.value && entry.memoryType !== filterType.value) return false;
    if (filterAuthor.value && entry.author !== filterAuthor.value) return false;
    if (Number(filterImportance.value) > 0 && (entry.importance || 0) < Number(filterImportance.value)) return false;
    return true;
  });
});

function applyFilters() {
  // Filters are reactive — nothing to do, computed handles it
}

function getAuthorProfile(did: string): Profile | undefined {
  return profileCache.value[did];
}

function getAuthorName(did: string): string {
  const profile = profileCache.value[did];
  if (profile?.username) return profile.username;
  if (profile?.givenName) return profile.givenName;
  // Shorten DID for display
  if (did) return did.slice(0, 16) + '...';
  return 'Unknown';
}

function getAuthorInitial(did: string): string {
  const name = getAuthorName(did);
  return name.charAt(0).toUpperCase();
}

function formatType(type: string): string {
  if (!type) return 'Unknown';
  return type
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(ts: string): string {
  if (!ts) return '';
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}

function renderMarkdown(content: string): string {
  if (!content) return '';
  // Simple markdown-to-HTML: headings, bold, italic, code, line breaks
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function parseTags(tags: string): string[] {
  if (!tags) return [];
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function filterByTag(tag: string) {
  // Simple tag filter — just filter to entries containing this tag
  // Could be enhanced with a dedicated tag filter in the future
  filterType.value = '';
  filterAuthor.value = '';
  filterImportance.value = '0';
  // For now, we'll use the search approach — filter allEntries by tag
  // This is a UX enhancement we can add later
}
</script>

<style scoped lang="scss">
.memory-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.memory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--j-space-500);
  border-bottom: 1px solid var(--j-color-ui-100);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: var(--j-space-400);
}

.memory-filter {
  background: var(--j-color-ui-50);
  border: 1px solid var(--j-color-ui-100);
  border-radius: var(--j-border-radius);
  padding: var(--j-space-200) var(--j-space-300);
  color: inherit;
  font-size: var(--j-font-size-300);
  cursor: pointer;
  min-width: 120px;

  &:hover {
    border-color: var(--j-color-primary-500);
  }
}

.memory-count {
  padding: var(--j-space-300) var(--j-space-500);
  flex-shrink: 0;
}

.memory-stream {
  flex: 1;
  overflow-y: auto;
  padding: var(--j-space-500);
}

.memory-loading,
.memory-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--j-space-400);
  opacity: 0.6;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: var(--j-space-400);
}

.memory-card {
  background: var(--j-color-ui-50);
  border: 1px solid var(--j-color-ui-100);
  border-radius: var(--j-border-radius);
  padding: var(--j-space-500);
  transition: border-color 0.15s ease;
  border-left: 3px solid var(--j-color-ui-200);

  &:hover {
    border-color: var(--j-color-primary-300);
  }

  &.type-long_term,
  &.type-long-term {
    border-left-color: var(--j-color-success-500);
  }

  &.type-conversation {
    border-left-color: var(--j-color-primary-500);
  }

  &.type-soa-prototype {
    border-left-color: var(--j-color-warning-500);
  }

  &.type-decision {
    border-left-color: var(--j-color-danger-500);
  }

  &.type-technical {
    border-left-color: #8b5cf6;
  }

  &.high-importance {
    background: rgba(var(--j-color-warning-500-rgb, 234, 179, 8), 0.05);
  }
}

.memory-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--j-space-300);
  flex-wrap: wrap;
  gap: var(--j-space-200);
}

.memory-type-badge {
  font-size: var(--j-font-size-200);
  padding: 2px var(--j-space-200);
  border-radius: 99px;
  background: var(--j-color-ui-100);
  color: var(--j-color-ui-600);
  white-space: nowrap;
}

.memory-importance {
  font-size: 10px;
  line-height: 1;
}

.memory-card-content {
  font-size: var(--j-font-size-400);
  line-height: 1.6;
  word-break: break-word;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin-top: var(--j-space-300);
    margin-bottom: var(--j-space-200);
  }

  :deep(h1) {
    font-size: var(--j-font-size-600);
  }

  :deep(h2) {
    font-size: var(--j-font-size-500);
  }

  :deep(p) {
    margin: var(--j-space-200) 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: var(--j-space-500);
  }

  :deep(code) {
    background: var(--j-color-ui-100);
    padding: 2px var(--j-space-200);
    border-radius: 3px;
    font-size: 0.9em;
  }

  :deep(pre) {
    background: var(--j-color-ui-100);
    padding: var(--j-space-400);
    border-radius: var(--j-border-radius);
    overflow-x: auto;
  }

  :deep(strong) {
    font-weight: 700;
  }
}

.memory-card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--j-space-200);
  margin-top: var(--j-space-300);
  padding-top: var(--j-space-300);
  border-top: 1px solid var(--j-color-ui-100);
}

.memory-tag {
  font-size: var(--j-font-size-200);
  padding: 2px var(--j-space-200);
  border-radius: 99px;
  background: var(--j-color-primary-50);
  color: var(--j-color-primary-700);
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--j-color-primary-100);
  }
}
</style>
