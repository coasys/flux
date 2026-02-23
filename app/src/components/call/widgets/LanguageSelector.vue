<template>
  <select
    :value="modelValue"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    aria-label="Transcription language"
    style="background: var(--j-color-ui-100); color: var(--j-color-ui-800); border: 1px solid var(--j-color-ui-300); border-radius: 4px; padding: 2px 6px; font-size: 12px;"
  >
    <option value="en">English</option>
    <option value="de">German</option>
  </select>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>();
defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
