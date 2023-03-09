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

          <j-flex direction="column" gap="500">
            <j-box p="500" bg="ui-100" v-for="pkg in packages" :key="pkg.name">
              <j-flex a="center" j="between">
                <div>
                  <j-text variant="heading-sm">{{ pkg.name }}</j-text>
                  <j-text>{{ pkg.description }}</j-text>
                </div>
                <div>
                  <j-button
                    :variant="isSelected(pkg) ? 'subtle' : 'primary'"
                    @click="() => toggleView(pkg)"
                  >
                    {{ isSelected(pkg) ? "Remove" : "Add" }}
                  </j-button>
                </div>
              </j-flex>
            </j-box>
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
import { getPerspectiveViews } from "@/utils/npmApi";

export default defineComponent({
  emits: ["cancel", "submit"],
  async created() {
    const res = await getPerspectiveViews();
    this.packages = res.map((r: any) => r.package);
  },
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    };
  },
  data() {
    return {
      packages: [] as any,
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
    validSelectedViews() {
      return this.selectedViews.length >= 1;
    },
  },
  methods: {
    isSelected(pkg: any) {
      return this.selectedViews.includes(pkg.name);
    },
    toggleView(pkg: any) {
      const isSelected = this.selectedViews.includes(pkg.name);
      this.selectedViews = isSelected
        ? this.selectedViews.filter((n) => n !== pkg.name)
        : [...this.selectedViews, pkg.name];
    },
    async createChannel() {
      const communityId = this.$route.params.communityId as string;
      const name = this.channelName;
      this.isCreatingChannel = true;
      this.dataStore
        .createChannel({
          perspectiveUuid: communityId,
          name,
          views: this.selectedViews,
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
