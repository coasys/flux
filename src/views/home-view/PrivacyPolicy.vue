<template>
  <article-layout :heroImg="privacyPolicy?.heroImg?.url">
    <div v-if="privacyPolicy">
      <j-text variant="heading-lg">{{ privacyPolicy.title }}</j-text>
      <structured-text :content="privacyPolicy.content"></structured-text>
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
      privacyPolicy: null,
    };
  },
  methods: {
    async getContent() {
      const { privacyPolicy } = await getData({
        query: /* GraphQL */ `
          {
            privacyPolicy {
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

      this.privacyPolicy = privacyPolicy;
    },
  },
});
</script>
