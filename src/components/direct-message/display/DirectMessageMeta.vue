<template>
  <div class="directMessageMeta">
    <div class="directMessageMeta__sender">
      <profile-avatar :diameter="3"></profile-avatar>
      <img src="" alt="" class="directMessageMeta__sender--icon" />
      <p class="directMessageMeta__sender--username">{{ message.username }}</p>
      <p class="directMessageMeta__sender--time">{{ time }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { format, parseISO } from 'date-fns';
import ProfileAvatar from "../../ui/avatar/ProfileAvatar.vue";
import { defineComponent, PropType } from 'vue';
import Expression from '@perspect3vism/ad4m/Expression';

export default defineComponent({
  props: {
    message: { type: Object as PropType<any>, required: true },
  },
  computed: {
    time(): string {
      const message = this.message as Expression;
      const time = parseISO(message.timestamp
        .split('+')[0]
        .replace('Z', ''));
      return format(time, 'h:mm a');
    },
  },
  components: {
    ProfileAvatar,
  },
});
</script>

<style lang="scss" scoped>
.directMessageMeta {
  display: flex;
  margin-top: 1.5rem;

  &__sender {
    display: flex;
    align-items: center;

    &--username {
      font-size: 1.4rem;
      font-weight: 700;
      margin-left: .5rem;
      color: var(--junto-primary);
    }
  }

  &__timestamp {
    font-size: 1.2rem;
  }
}
</style>