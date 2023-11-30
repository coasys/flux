<template>
  <j-box p="800">
    <j-box pb="800">
      <j-text variant="heading-sm">Add a Web3 Wallet to your profile</j-text>
    </j-box>

    <div class="wallets">
      <div
        class="wallet"
        @click="() => addEntanglementProofToProfile(proof)"
        v-for="proof in proofs"
        radius="md"
        p="500"
        bg="ui-50"
      >
        <j-flex a="center" j="center" gap="500" direction="column">
          <div class="wallet-avatar" v-html="getIcon(proof.deviceKey)"></div>
          <j-text size="600" weight="600" color="black">
            {{ shortETH(proof.deviceKey) }}
          </j-text>
        </j-flex>
      </div>
      <a href="https://web3-adam.netlify.app/" target="_blank" class="wallet">
        Connect wallet
      </a>
    </div>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { getAd4mClient } from "@perspect3vism/ad4m-connect";
import { EntanglementProof, Link } from "@perspect3vism/ad4m";
// @ts-ignore
import jazzicon from "@metamask/jazzicon";

export default defineComponent({
  emits: ["close"],

  async setup() {
    const client = await getAd4mClient();

    const proofs: any = await client.agent.getEntanglementProofs();

    return {
      client,
      proofs: ref<EntanglementProof[]>(proofs),
    };
  },
  methods: {
    getIcon(address: string) {
      if (address) {
        const seed = parseInt(address.slice(2, 10), 16);
        const diameter = 40;
        const icon = jazzicon(diameter, seed);
        icon.innerHTML;
        return icon.innerHTML;
      }
    },
    shortETH(address: string) {
      if (!address || address.length !== 42 || !address.startsWith("0x")) {
        return "Invalid ETH Address";
      }
      return `${address.substring(0, 8)}...${address.substring(
        address.length - 4
      )}`;
    },
    async addEntanglementProofToProfile(proof: EntanglementProof) {
      try {
        const proofExpression = await this.client.expression.create(
          proof,
          "literal"
        );

        await this.client.agent.mutatePublicPerspective({
          additions: [
            new Link({
              source: "ad4m://self",
              predicate: "ad4m://entanglement_proof",
              target: proofExpression,
            }),
          ],
          removals: [],
        });

        this.$emit("close");
      } catch (e) {
        console.log(e);
      }
    },
  },
});
</script>

<style scoped>
.wallets {
  display: grid;
  gap: var(--j-space-500);
  grid-template-columns: 1fr 1fr 1fr 1fr;
}

.wallet {
  text-decoration: none;
  color: currentColor;
  display: grid;
  place-content: center;
  place-items: center;
  height: 100%;
  padding: var(--j-space-500);
  border-radius: var(--j-border-radius-md);
  background: var(--j-color-ui-50);
  border: 1px solid var(--j-color-ui-200);
}

.wallet:hover {
  border: 1px solid var(--j-color-ui-400);
}
</style>
