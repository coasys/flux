<template>
  <div class="view-options">
    <label class="view-option" v-for="view in viewOptions" :key="view.type">
      <input type="checkbox" :value="view.type" v-model="proxySel" />
      <j-icon class="view-option__checkmark" size="xs" name="check" />
      <j-flex a="center" gap="500">
        <div class="view-option__icon">
          <j-icon size="lg" :name="view.icon" />
        </div>
        <div>
          <div class="view-option__title">{{ view.title }}</div>
          <div class="view-option__desc">
            {{ view.description }}
          </div>
        </div>
      </j-flex>
    </label>
  </div>
</template>

<script setup lang="ts">
import { viewOptions } from "@/constants";
import { ChannelView } from "@coasys/flux-types";
import { ref, watch } from "vue";

interface Props {
  views?: ChannelView[];
}

const props = defineProps<Props>();
const emit = defineEmits<{ change: [value: ChannelView[]] }>();
const proxySel = ref<ChannelView[]>([]);

watch(
  () => props.views,
  (val) => {
    if (val) proxySel.value = val;
  },
  { immediate: true }
);

watch(proxySel, (val) => emit("change", val));
</script>

<style scoped>
.view-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--j-space-500);
}

.view-option {
  position: relative;
  display: block;
  border: 2px solid transparent;
  background-color: var(--j-color-ui-50);
  border-radius: var(--j-border-radius);
  padding: var(--j-space-500);
}

.view-option:hover {
  border: 2px solid var(--j-color-ui-100);
}

.view-option:has(input:checked) {
  border: 2px solid var(--j-color-primary-500);
}

.view-option:has(input:checked) .view-option__checkmark {
  opacity: 1;
  transform: scale(1);
}

.view-option__checkmark {
  transition: all 0.2s ease;
  opacity: 0;
  transform: scale(0.8);
  position: absolute;
  background-color: var(--j-color-primary-500);
  color: var(--j-color-white);
  border-radius: 50%;
  width: var(--j-size-xxs);
  height: var(--j-size-xxs);
  left: var(--j-space-100);
  top: calc(var(--j-size-xs) / 2 * -1);
}

.view-option input {
  position: absolute;
  clip: rect(1px 1px 1px 1px);
  clip: rect(1px, 1px, 1px, 1px);
  vertical-align: middle;
}

.view-option__title {
  font-size: var(--j-font-size-600);
  color: var(--j-color-black);
  font-weight: 600;
  margin-bottom: var(--j-space-200);
}

.view-option__desc {
  font-size: var(--j-font-size-400);
  color: var(--j-color-ui-500);
  font-weight: 400;
  margin-bottom: var(--j-space-100);
}
</style>
