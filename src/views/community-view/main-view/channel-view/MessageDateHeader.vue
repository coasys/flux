<template>
  <div class="message-date-header">
    <div class="message-date-header__divider">&nbsp;</div>
    <div class="message-date-header__value">{{ value }}</div>
    <div class="message-date-header__divider">&nbsp;</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
// eslint-disable-next-line object-curly-newline
import { format, isToday, isYesterday, parse } from "date-fns";

export default defineComponent({
  props: {
    date: { type: String, required: true, default: Date.now() },
  },
  computed: {
    value(): string {
      console.log("test", parse(this.date, "MM/dd/yyyy", Date.now()));
      if (isToday(parse(this.date, "MM/dd/yyyy", Date.now()))) {
        return "Today";
      }
      if (isYesterday(parse(this.date, "MM/dd/yyyy", Date.now()))) {
        return "Yesterday";
      }
      return format(parse(this.date, "MM/dd/yyyy", Date.now()), "MMM dd, yyyy");
    },
  },
});
</script>

<style lang="scss" scoped>
.message-date-header {
  display: flex;
  align-items: center;
  width: 100%;
  &__divider {
    flex-grow: 1;
    height: 1px;
    border-bottom: 1px solid var(--junto-border-color);
  }
  &__value {
    padding: 10px;
    font-size: 1.2rem;
    border-radius: 10px;
    border: 1px solid var(--junto-border-color);
    text-align: center;
    color: var(--junto-primary);
    font-weight: 600;
  }
}
</style>
