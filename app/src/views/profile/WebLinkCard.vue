<template>
  <div class="link-card">
    <div class="link-card__image">
      <img v-if="image" :src="image" />
      <j-icon class="link-card__icon" v-else name="link"></j-icon>
    </div>
    <div class="link-card__content">
      <a :href="url" target="_blank" class="link-card__info">
        <h2 class="link-card__title">
          {{ title || url }}
        </h2>
        <div class="link-card__description" v-if="description">
          {{ description }}
        </div>
        <div class="link-card__url" v-if="title">{{ hostname }}</div>
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
    </div>
  </div>
</template>

<script lang="ts">
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils.js";
import { getLiteralObjectLinks } from "utils/helpers/linkHelpers";
import { defineComponent } from "vue";
export default defineComponent({
  props: ["id", "title", "description", "url", "image", "sameAgent"],
  emits: ["delete", "edit"],

  computed: {
    hostname() {
      return new URL(this.url).hostname;
    },
  },
  methods: {
    async deleteLink() {
      const client = await getAd4mClient();
      const { perspective } = await client.agent.me();
      if (perspective) {
        const links = await getLiteralObjectLinks(this.id, perspective.links);
        this.$emit("delete", links[0]);

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
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: var(--j-space-300);
  border-radius: var(--j-border-radius);
  text-decoration: none;
  background-color: var(--j-color-ui-50);
  overflow: hidden;
}

@media (min-width: 800px) {
  .link-card {
    grid-template-columns: 1fr 5fr;
  }
}

.link-card__image {
  display: grid;
  place-items: center;
  cursor: pointer;
  width: 100%;
  height: 100%;
  padding: var(--j-space-500);
  overflow: hidden;
}

.link-card__image img {
  width: 100%;
  border-radius: 100%;
  aspect-ratio: 1/1;
  overflow: hidden;
  object-fit: cover;
}

.link-card__content {
  padding: var(--j-space-400);
  padding-right: var(--j-space-900);
  overflow: hidden;
}

.link-card__info {
  cursor: pointer;
  text-decoration: none;
}

.link-card__icon {
  --j-icon-size: 50px;
}

.link-card__title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  margin-bottom: var(--j-space-300);
  font-size: var(--j-font-size-500);
  font-weight: 800;
  color: var(--j-color-black);
}

.link-card__description {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  margin-bottom: var(--j-space-300);
  font-size: var(--j-font-size-500);
  font-weight: 400;
  color: var(--j-color-ui-500);
}

.link-card__url {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--j-font-size-500);
  color: var(--j-color-ui-800);
}

.delete-button {
  position: absolute;
  right: var(--j-space-100);
  top: var(--j-space-100);
}
</style>
