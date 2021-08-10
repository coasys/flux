<template>
  <article-layout :heroImg="heroImg">
    <j-text variant="heading">FAQs</j-text>
    <div>
      <j-text variant="heading-sm">
        What's the legal status of Junto Foundation?
      </j-text>
      <j-text
        >We are a 501(c)4 nonprofit incorporated in New York state.</j-text
      >
      <j-text variant="heading-sm"> Where are you based? </j-text>
      <j-text>
        Our team is distributed across the world! We have a remote-first culture
        and some of the places we're located include the US, UK, and Trinidad
        and Tobago, Russia, India, and more.
      </j-text>
      <j-text variant="heading-sm">What are your organizational values?</j-text>
      <j-text>
        Open, accessible, & equitable Junto will be available to anyone,
        regardless of financial means. We're not going to facilitate targeted
        ads, require paid subscriptions, or put premium features behind a
        paywall. Choosing to support us is completely optional.
      </j-text>
      <j-text
        >Partnership & collaboration We believe Junto will thrive when it is
        created in partnership with those who use it. Let's work together to
        create a social media experience that serves us, not the other way
        around.
      </j-text>
      <j-text variant="heading-sm">Transparency & trust </j-text>
      <j-text>
        We believe people will support Junto because they understand its value
        in the world and in their lives. We trust the Junto community to support
        our work through monthly donations and will provide visibility into our
        spending, roadmap, and operational activities.
      </j-text>
      <j-text variant="heading-sm">Can I see Junto Foundation's budget?</j-text>
      <j-text
        >Yes. We are committed to being transparent about how we allocate and
        spend resources. You can see our [revenue model & growth
        projections](https://learn.junto.foundation/financials/revenue-model),
        [financial
        roadmap](https://learn.junto.foundation/financials/revenue-projections-and-financial-roadmap),
        and [proposed budget for
        2021](https://learn.junto.foundation/financials/proposed-budget-for-2021).
      </j-text>
      <j-text variant="heading-sm">
        How much investment have you raised?
      </j-text>
      <j-text>
        In the first two months of 2019, we raised over $110K from 773 people
        via crowdfunding campaigns. Since then, we've raised an additional $150K
        from mission-aligned supporters and advisors.
      </j-text>
      <j-text variant="heading-sm">How do I get in touch with you? </j-text>
      <j-text>
        Email hi@junto.fondation. If you want to get involved, [learn more
        here](https://learn.junto.foundation/about/contributing).
      </j-text>
    </div>
  </article-layout>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ArticleLayout from "@/layout/ArticleLayout.vue";

export default defineComponent({
  components: { ArticleLayout },
  data() {
    return {
      heroImg:
        "https://www.notion.so/image/https%3A%2F%2Fwww.notion.so%2Fimages%2Fpage-cover%2Fmet_william_morris_1877_willow.jpg?table=block&id=e76ac417-349e-4f57-afc7-3a0e998c7fb9&spaceId=9eca8f73-6eaa-44ff-81ea-6d64a177af2b&width=3360&userId=1981025e-092b-4ff0-ac81-da8d110abdc0&cache=v2",
    };
  },
});
</script>
