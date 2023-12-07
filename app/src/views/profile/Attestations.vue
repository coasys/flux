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
        <a
          target="_blank"
          :href="`https://sepolia.easscan.org/attestation/view/${attestation.id}`"
        >
          See on EAS Scan
        </a>
      </j-box>
    </j-box>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { getAd4mClient } from "@perspect3vism/ad4m-connect";
import { useMe } from "@fluxapp/vue";
const EAS_LANG = "QmzSYwdiqjYXRAaoJdARpP7xRj4VQfdTT3J4HNGLohdKeuBgo1E";

export default defineComponent({
  props: {
    address: {
      type: String,
      required: true,
    },
  },
  async setup() {
    const client = await getAd4mClient();

    const { me } = useMe(client.agent);

    return {
      me,
      client,
      attestations: ref<any>([]),
    };
  },
  mounted() {
    this.getAttestations();
  },
  watch: {
    address: {
      handler: async function () {
        this.getAttestations();
      },
      immediate: true,
    },
  },
  methods: {
    async getAttestations() {
      await this.client.languages.byAddress(EAS_LANG);

      const expression = await this.client.expression.get(
        `${EAS_LANG}://${this.address}`
      );

      const attestations = JSON.parse(expression?.data || "[]");

      const json = attestations.map((a: any) => JSON.parse(a.decodedDataJson));

      this.attestations = json;
    },
  },
});
</script>

<style scoped>
.avatar {
  display: flex;
  border-radius: 50%;
  overflow: hidden;
}
</style>
