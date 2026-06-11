<template>
  <div>
    <j-box pt="900" pb="400">
      <j-text uppercase size="300" weight="800" color="primary-500" variant="success"> Make a new todo </j-text>
    </j-box>

    <input
      autoFocus
      :class="styles.titleInput"
      placeholder="Write a title"
      v-model="title"
      @keydown.enter="createTodo"
    />

    <j-box pt="500">
      <j-flex gap="300" direction="column">
        <j-box v-for="todo in todos" bg="ui-50" p="400" radius="md">
          <j-flex j="between">
            <div :class="{ [styles.doneTodo]: todo.done }">
              <j-checkbox
                @change="toggleTodo({ id: todo.id, done: $event.target.checked })"
                :checked="todo.done"
                style="--j-border-radius: 50%"
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
            <j-button @click="deleteTodo(todo.id)">Delete</j-button>
          </j-flex>
        </j-box>
      </j-flex>
    </j-box>
  </div>
</template>

<script setup lang="ts">
import { Link, LinkQuery, PerspectiveProxy } from '@coasys/ad4m';
import { ref, onMounted, onUnmounted } from 'vue';

import Todo from '../subjects/Todo';

import styles from '../Plugin.module.css';

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

const { perspective, source } = defineProps<Props>();

const title = ref('');
const todos = ref<Todo[]>([]);

async function loadTodos() {
  const links = await perspective.get(new LinkQuery({ source, predicate: 'ad4m://has_child' }));
  const items = await Promise.all(
    links.map(async (link) => {
      const todo = new Todo(perspective, link.data.target);
      await todo.get();
      return todo;
    }),
  );
  todos.value = items;
}

// Targeted SPARQL subscription: fires only when the set of `ad4m://has_child`
// links from THIS source changes, instead of waking on every link event in
// the perspective.  Mirrors the pattern used across the Flux app and views.
let todoLinksSub: { dispose: () => void } | null = null;
let unmounted = false;

onMounted(async () => {
  await perspective.ensureSDNASubjectClass(Todo);
  loadTodos();
  try {
    const sub = await perspective.subscribeQuery(
      `SELECT ?id WHERE { <${source}> <ad4m://has_child> ?id . }`,
    );
    if (unmounted) {
      sub.dispose();
      return;
    }
    todoLinksSub = sub;
    sub.onResult(() => loadTodos());
  } catch (error) {
    console.error('Failed to subscribe to todo links:', error);
  }
});

onUnmounted(() => {
  unmounted = true;
  todoLinksSub?.dispose();
});

const createTodo = async () => {
  const todo = await Todo.create(perspective, { title: title.value });
  await perspective.add(new Link({ source, predicate: 'ad4m://has_child', target: todo.id }));
  loadTodos();
};

const toggleTodo = ({ id, done }) => {
  const todo = new Todo(perspective, id);
  todo.done = done;
  todo.update();
};

const deleteTodo = (id: string) => {
  const todo = new Todo(perspective, id);
  todo.delete();
};
</script>
