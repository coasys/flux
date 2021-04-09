<template>
  <div class="createDirectMessage">
    <div class="createDirectMessage__text-field">
      <input
        type="text"
        class="createDirectMessage__text-field--input"
        v-model="message"
        v-on:keyup.enter="createDirectMessage"
      />
      <svg class="createDirectMessage__text-field--icon">
        <use href="../../../assets/icons/icons.svg#send"></use>
      </svg>
    </div>
  </div>
</template>

<script>
export default {
  props: ["createMessage"],
  data() {
    return {
      message: "",
    };
  },
  methods: {
    createDirectMessage() {
      const message = {
        id: Date.now().toString,
        username: "junto",
        type: "TextMessage",
        message: this.message,
      };
      //   Validate whether message is empty or not
      if (this.message !== "") {
        this.createMessage(message);
      } else {
        return;
      }
      //   Reset input to an empty string
      this.message = "";
    },
  },
};
</script>


<style lang="scss" scoped>
@import "../../../assets/sass/main.scss";
.createDirectMessage {
  height: 7.5rem;
  width: 100%;
  padding: 2rem;
  background-color: var(--junto-background-color);
  border-top: 1px solid var(--junto-border-color);
  position: absolute;
  bottom: 0;
  left: 0;

  &__text-field {
    width: 100%;
    outline: none;
    font-size: 1.4rem;
    border-radius: 5px;
    padding: 1rem;
    border: 1px solid var(--junto-border-color);
    display: flex;
    align-items: center;

    &--icon {
      height: 1.7rem;
      width: 1.7rem;
      fill: var(--junto-primary);
    }

    &--input {
      width: 100%;
      border: 0;
      outline: none;
      font-size: 1.4rem;
      background-color: transparent;
      color: var(--junto-primary);
    }
  }
}
</style>