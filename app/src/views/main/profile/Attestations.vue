<template>
  <j-box>
    <j-box pt="900" v-if="attestations.length">
      <j-text size="600" color="black" weight="700">Attestations</j-text>
      <j-box pb="900" v-for="(attestation, index) in attestations" :key="index">
        <j-box v-for="object in attestation">
          <j-text>{{ object.value.name }}</j-text>
          <j-badge>{{ object.value.type }}</j-badge>
          <j-text>{{ object.value.value }}</j-text>
        </j-box>
        <a target="_blank" :href="`https://sepolia.easscan.org/attestation/view/${attestation.id}`">
          See on EAS Scan
        </a>
      </j-box>
    </j-box>
  </j-box>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores';
import { onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

const props = defineProps({ address: { type: String, required: true } });
const appStore = useAppStore();
const { ad4mClient } = storeToRefs(appStore);

const EAS_LANG = 'QmzSYwdiqjYXRAaoJdARpP7xRj4VQfdTT3J4HNGLohdKeuBgo1E';
const attestations = ref<any>([]);

async function getAttestations() {
  // Guard against null client
  if (!ad4mClient.value) return;

  try {
    await ad4mClient.value.languages.byAddress(EAS_LANG);
    const expression = await ad4mClient.value.expression.get(`${EAS_LANG}://${props.address}`);
    const fetchedAttestations = JSON.parse(expression?.data || '[]');
    const json = fetchedAttestations.map((a: any) => JSON.parse(a.decodedDataJson));
    attestations.value = json;
  } catch (error) {
    console.error('Attestations: Error fetching attestations:', error);
    // Silently fail - attestations are optional
  }
}

// Only call on mount if client is available
onMounted(() => {
  if (ad4mClient.value) getAttestations();
});

// Watch for address changes
watch(
  () => props.address,
  () => {
    if (ad4mClient.value) getAttestations();
  },
);

// Watch for client to become available
watch(ad4mClient, (newClient) => {
  if (newClient) getAttestations();
});
</script>

<style scoped>
.avatar {
  display: flex;
  border-radius: 50%;
  overflow: hidden;
}
</style>
