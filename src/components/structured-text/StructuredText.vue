<template>
  <datocms-structured-text :data="content" :customRules="customRules" />
</template>

<script lang="ts">
import { StructuredText, renderRule } from "vue-datocms";
import { isHeading, isLink, isParagraph } from "datocms-structured-text-utils";
import { defineComponent, h } from "vue";

function getVariant(level: number) {
  switch (level) {
    case 1:
      return "heading-lg";
    case 2:
      return "heading";
    case 3:
      return "heading-sm";
    case 4:
      return "subheading";
    default:
      return "body";
  }
}

export default defineComponent({
  components: {
    "datocms-structured-text": StructuredText,
  },
  props: {
    content: Object,
  },
  data() {
    return {
      customRules: [
        renderRule(isHeading, ({ node, children, key }) => {
          return h("j-box", { pt: "700" }, [
            h(
              `j-text`,
              { key, variant: getVariant(node.level), tag: `h${node.level}` },
              [...(children || [])]
            ),
          ]);
        }),
        renderRule(isParagraph, ({ node, children, key }) => {
          return h(`j-text`, { key, variant: "body", tag: "p" }, [
            ...(children || []),
          ]);
        }),
        renderRule(isLink, ({ node, children, key }) => {
          return h(
            `a`,
            { key, href: node.url, style: "color: var(--j-color-primary-500)" },
            [...(children || [])]
          );
        }),
      ],
    };
  },
});
</script>
