<template>
  <article-layout :heroImg="page?.heroImg?.url">
    <div v-if="page">
      <j-text variant="heading-lg">{{ page.title }}</j-text>
      <structured-text :content="page.content"></structured-text>
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
      page: null,
    };
  },
  methods: {
    async getContent() {
      const { tutorial } = await getData({
        query: /* GraphQL */ `
          {
            tutorial {
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

      this.page = tutorial;
    },
  },
});
</script>
