<template>
  <div>
    <j-box pt="900" pb="400">
      <j-text
        uppercase
        size="300"
        weight="800"
        color="primary-500"
        variant="success"
      >
        Make a new todo
      </j-text>
    </j-box>

    <input
      autoFocus
      :class="styles.titleInput"
      placeholder="Write a title"
      v-model="title"
      @keydown.enter="createTodo"
    ></input>

    <j-box pt="500">
      <j-flex gap="300" direction="column">
        <j-box v-for="todo in todos" bg="ui-50" p="400" radius="md">
          <j-flex j="between">
            <div :class="{ [styles.doneTodo]: todo.done }">
              <j-checkbox
                @change="toggleTodo({ id: todo.baseExpression, done: $event.target.checked })"
                :checked="todo.done"
                style="--j-border-radius: 50%;"
                size="sm"
              >
                <j-icon slot="checkmark" size="xs" name="check"></j-icon>
                <j-text size="500" nomargin>
                  {{ todo.title }}
                </j-text>
                <j-text size="500" nomargin>
                  {{ todo.desc }}
                </j-text>
              </j-checkbox>
            </div>
            <j-button @click="deleteTodo(todo.baseExpression)">Delete</j-button>
          </j-flex>
        </j-box>
      </j-flex>
    </j-box>
  </div>
</template>

<script setup lang="ts">
import { PerspectiveProxy } from "@coasys/ad4m";
// import { useModel } from "@coasys/ad4m-vue-hooks";
import { useModel } from "@coasys/flux-utils/src/useModelVue";
import { ref, computed, onMounted } from 'vue';

import Todo from "../subjects/Todo";

import styles from "../Plugin.module.css";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

const { perspective, source } = defineProps<Props>();

const title = ref("")

onMounted(async () => {
  await perspective.ensureSDNASubjectClass(Todo);
});

const { entries: todos } = useModel({ perspective, model: Todo, query: { source }, location: 'TodoView create' });

const createTodo = () => {
  const todo = new Todo(perspective, undefined, source);
  todo.title = title.value;
  todo.save();
}

const toggleTodo = ({ id, done }) => {
  const todo = new Todo(perspective, id, source);
  todo.done = done;
  todo.update();
}

const deleteTodo = (id: string) => {
  const todo = new Todo(perspective, id, source);
  todo.delete();
}
</script>
