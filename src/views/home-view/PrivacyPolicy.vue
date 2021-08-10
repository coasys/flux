<template>
  <article-layout :heroImg="foundation?.heroImg?.url">
    <div v-if="foundation">
      <j-text variant="heading-lg">{{ foundation.title }}</j-text>
      <structured-text :content="foundation.content"></structured-text>
    </div>
  </article-layout>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ArticleLayout from "@/layout/ArticleLayout.vue";
import StructuredText from "@/components/structured-text/StructuredText.vue";
import { getData } from "@/utils/datocms";

export default defineComponent({
  components: { ArticleLayout, StructuredText },
  mounted() {
    this.getContent();
  },
  data() {
    return {
      foundation: null,
    };
  },
  methods: {
    async getContent() {
      const data = await getData({
        query: /* GraphQL */ `
          {
            foundation {
              title
              heroImg {
                url
              }
              content {
                value
              }
            }
          }
        `,
      });

      this.foundation = data.foundation;
    },
  },
});
</script>
