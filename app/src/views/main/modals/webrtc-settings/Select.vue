<template>
  <div :class="selectClass">
    <div v-if="label && !hideLabel" class="label">
      <label :for="name">
        <j-text variant="body">{{ label }}</j-text>
      </label>
    </div>
    <div class="wrapper">
      <select
        :id="`select-${name}`"
        :name="name"
        class="field"
        :value="selected"
        @change="onChange"
        @blur="onBlur"
        :aria-label="hideLabel ? label : undefined"
        :disabled="disabled"
        :autofocus="autoFocus"
      >
        <option hidden value="">
          {{ placeholder || 'Velg' }}
        </option>
        <option
          v-for="(option, i) in sortedAndFilteredOptions"
          :key="`${name}-${option.value}-${option.text}-${i}`"
          :value="String(option.value)"
          :disabled="option.disabled"
          :aria-label="option.ariaLabel"
        >
          {{ option.text }}
        </option>
      </select>
      <div class="placeholder" aria-hidden="true">
        {{ selectedOption ? selectedOption.text : placeholder }}
      </div>
      <div class="arrow">
        <j-icon name="chevron-down" size="xs"></j-icon>
      </div>
    </div>
    <div v-if="showFeedback" :id="`input-${name}-feedback`">
      <div class="message" aria-live="polite">
        <p class="sr">
          {{ error && `${error ? 'Error: ' : ''}${placeholder}` }}
        </p>
        {{ error || success }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface SelectOption {
  text: string;
  order?: number;
  value: number | string | undefined;
  disabled?: boolean;
  ariaLabel?: string;
}

interface Props {
  name: string;
  label: string;
  placeholder?: string;
  selected?: string | number | undefined;
  options?: SelectOption[];
  full?: boolean;
  error?: string;
  success?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  monochrome?: boolean;
  autoFocus?: boolean;
  onChange: (event: Event) => void;
  onBlur?: (event: Event) => void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  options: () => [],
  full: false,
  error: undefined,
  success: undefined,
  hideLabel: false,
  disabled: false,
  monochrome: false,
  autoFocus: false,
  onBlur: undefined,
});

const showFeedback = computed(() => props.error || props.success);

const selectClass = computed(() => {
  return {
    select: true,
    '-full': props.full,
    '-error': !!props.error,
    '-show-message': !!showFeedback.value,
    '-disabled': props.disabled,
    '-monochrome': props.monochrome,
  };
});

const sortedAndFilteredOptions = computed(() => {
  return [...props.options].sort((a, b) => (a.order || 0) - (b.order || 0)).filter((option) => !option.disabled);
});

const selectedOption = computed(() => {
  return props.options.find((o) => String(o.value) === String(props.selected));
});
</script>

<style scoped>
.select {
  display: inline-block;
  width: 100%;
}

.wrapper {
  position: relative;
  display: inline-block;
  user-select: none;
  width: 100%;
  max-width: 100%;
  z-index: 0;
}

.wrapper option {
  color: #303030;
}

.label {
  display: block;
  font-size: 1.4rem;
  margin-bottom: var(--spacing-1);
}

.arrow {
  position: absolute;
  right: var(--j-space-400);
  top: 52%;
  transform: translateY(-50%);
  line-height: 1;
  z-index: 2;
  pointer-events: none;
}

.field {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  color: transparent;
  background: transparent;
  z-index: 1;
  font-size: var(--j-font-size-400);
  border-radius: var(--j-border-radius);
  border: 1px solid var(--j-border-color);
  background-image: none !important;
  appearance: none;
}

.field:focus {
  border: 1px solid var(--j-border-color-strong);
  outline: none;
}

.placeholder {
  display: flex;
  align-items: center;
  position: relative;
  height: var(--j-size-md);
  font-family: inherit;
  font-size: var(--j-font-size-400);
  color: var(--j-color-black);
  background: var(--j-color-white);
  border-radius: var(--j-border-radius);
  border: 1px solid var(--j-border-color);
  min-width: 200px;
  outline: 0px;
  padding: 0px var(--j-space-400);
  cursor: pointer;
  appearance: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all var(--transition);
  z-index: 2;
  pointer-events: none;
}

.message {
  display: block;
  font-size: 1.4rem;
  text-align: left;
}

@media (max-width: 32em) {
  .select {
    display: block;
    width: 100%;
  }
}

/* Modifiers */

.-full {
  display: block;
}

.-disabled {
  cursor: not-allowed;
}

.-disabled .wrapper {
  background-color: var(--col-light);
  opacity: 0.5;
}

.-disabled .field {
  border: 1px solid var(--col-dark);
}

.-error .field {
  border-color: var(--col-alert);
}

.-error .field:focus {
  border-color: var(--col-focus-border);
}

.-error .message {
  color: var(--col-alert);
}

.-monochrome .field:focus {
  background: var(--col-white);
}
</style>
