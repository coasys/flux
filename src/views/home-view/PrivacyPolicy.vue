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

const token = "6dff7c12521d35098fcde1648a9d89";

function getData({ query }: { query: string }) {
  return fetch("https://graphql.datocms.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: query,
    }),
  })
    .then((res) => res.json())
    .then((res) => res.data)
    .catch((error) => {
      console.log(error);
    });
}

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
