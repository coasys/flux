<template>
  <div class="link-card">
    <div class="link-card__image">
      <img v-if="image" :src="image" />
      <j-icon v-else name="link" size="xl"></j-icon>
    </div>
    <j-box py="400" pl="500" pr="700">
      <a :href="url" target="_blank" class="link-card__info">
        <j-text
          class="title"
          v-if="title"
          size="500"
          weight="800"
          color="black"
        >
          {{ title }}
        </j-text>
        <j-text v-if="title" size="400" color="ui-400">{{
          description
        }}</j-text>
        <j-text v-if="url" size="300" variant="link">{{ url }}</j-text>
      </a>
      <j-button
        size="sm"
        squared
        class="delete-button"
        variant="ghost"
        v-if="sameAgent"
        @click.stop="deleteLink"
        ><j-icon name="x"></j-icon
      ></j-button>
    </j-box>
  </div>
</template>

<script lang="ts">
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { getLiteralObjectLinks } from "utils/helpers/linkHelpers";
import { defineComponent } from "vue";
export default defineComponent({
  props: ["id", "title", "url", "description", "image", "sameAgent"],
  emits: ["delete", "edit"],
  methods: {
    async deleteLink() {
      const client = await getAd4mClient();
      const { perspective } = await client.agent.me();
      if (perspective) {
        const links = await getLiteralObjectLinks(this.id, perspective.links);

        await client.agent.mutatePublicPerspective({
          removals: links,
          additions: [],
        });
      }
    },
  },
});
</script>

<style scoped>
.link-card {
  position: relative;
  width: 100%;
  display: flex;
  gap: var(--j-space-300);
  border-radius: var(--j-border-radius);
  gap: var(--j-space-400);
  text-decoration: none;
  border: 1px solid var(--j-color-ui-200);
  border-radius: var(--j-border-radius);
}

.link-card:hover {
  background-color: var(--j-color-ui-50);
}

.link-card__image {
  display: grid;
  place-items: center;
  cursor: pointer;
  border-radius: var(--j-border-radius) 0 var(--j-border-radius) 0;
  width: 100%;
  max-width: 200px;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.link-card__image img {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  object-fit: cover;
}

.link-card__info {
  cursor: pointer;
  text-decoration: none;
}

.delete-button {
  position: absolute;
  right: var(--j-space-100);
  top: var(--j-space-100);
}
</style>
