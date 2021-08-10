<template>
  <article-layout hideHero>
    <j-box pt="800">
      <j-text variant="heading-lg">Frequently asked question</j-text>

      <j-tabs
        v-if="categories"
        :value="currentCategory"
        @change="(e) => (currentCategory = e.target.value)"
      >
        <j-tab-item variant="button" value="all">All</j-tab-item>
        <j-tab-item
          variant="button"
          :value="cat.id"
          :key="cat.name"
          v-for="cat in categories"
        >
          {{ cat.name }}
        </j-tab-item>
      </j-tabs>
      <j-box pt="700" pb="700" :key="faq.id" v-for="faq in sortedFaqs">
        <j-text variant="heading">
          {{ faq.question }}
        </j-text>
        <j-text>{{ faq.answer }}</j-text>
      </j-box>
    </j-box>
  </article-layout>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ArticleLayout from "@/layout/ArticleLayout.vue";
import { getData } from "@/utils/datocms";

interface Category {
  id: string;
  name: string;
}

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: Category[];
}

export default defineComponent({
  components: { ArticleLayout },
  mounted() {
    this.getContent();
  },
  data() {
    return {
      currentCategory: "all",
      faqs: null as Faq[] | null,
      categories: null as Category[] | null,
    };
  },
  computed: {
    sortedFaqs(): Faq[] {
      if (this.faqs === null) return [];
      if (this.currentCategory === "all") return this.faqs;
      return this.faqs.filter((faq) => {
        console.log(faq);
        return faq.category.some((cat) => {
          return cat.id === this.currentCategory;
        });
      });
    },
  },
  methods: {
    async getContent() {
      const { allFaqs } = await getData({
        query: /* GraphQL */ `
          query AllFaqs {
            allFaqs {
              id
              question
              answer
              category {
                id
                name
              }
            }
          }
        `,
      });

      const { allCategories } = await getData({
        query: /* GraphQL */ `
          query AllCategories {
            allCategories {
              id
              name
            }
          }
        `,
      });

      this.categories = allCategories;
      this.faqs = allFaqs;
    },
  },
});
</script>
