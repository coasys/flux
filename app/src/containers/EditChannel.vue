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

      <j-flex direction="column" gap="500">
        <j-box
          p="500"
          bg="ui-100"
          v-for="pkg in packages"
          :key="pkg.packageName"
        >
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
import { useDataStore } from "@/store/data";
import { FluxApp, getAllFluxApps } from "@/utils/npmApi";

export default defineComponent({
  props: ["channelId"],
  emits: ["cancel", "submit"],
  async created() {
    const res = await getAllFluxApps();
    this.packages = res;
  },
  setup() {
    return {
      packages: ref<FluxApp[]>([]),
      name: ref(""),
      description: ref(""),
      views: ref<FluxApp[]>([]),
      isSaving: ref(false),
      appStore: useAppStore(),
      dataStore: useDataStore(),
    };
  },
  computed: {
    canSave() {
      return this.views.length >= 1;
    },
    channel() {
      return this.dataStore.channels[this.channelId];
    },
  },
  watch: {
    channel: {
      handler: async function ({ name, description, views }) {
        this.name = name;
        this.description = description;
        this.views = views;
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    toggleView(pkg: FluxApp) {
      const isSelected = this.views.some(
        (app) => app.packageName === pkg.packageName
      );
      this.views = isSelected
        ? this.views.filter((app) => app.packageName !== pkg.packageName)
        : [...this.views, pkg];
    },
    isSelected(pkg: any) {
      return this.views.some((app) => app.packageName === pkg.packageName);
    },
    async updateChannel() {
      this.isSaving = true;
      this.dataStore
        .updateChannel({
          channelId: this.$route.params.channelId as string,
          data: {
            name: this.name,
            views: this.views,
          },
        })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isSaving = false;
        });
    },
  },
});
</script>
