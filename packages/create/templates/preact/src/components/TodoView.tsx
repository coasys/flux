import { useState, useEffect } from 'preact/hooks';
import { Link, LinkQuery, PerspectiveProxy } from '@coasys/ad4m';

import Todo from '../subjects/Todo';

import styles from '../Plugin.module.css';

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function TodoView({ perspective, source }: Props) {
  const [title, setTitle] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);

  async function loadTodos() {
    const links = await perspective.get(new LinkQuery({ source, predicate: 'ad4m://has_child' }));
    const items = await Promise.all(
      links.map(async (link) => {
        const todo = new Todo(perspective, link.data.target);
        await todo.get();
        return todo;
      }),
    );
    setTodos(items);
  }

  useEffect(() => {
    loadTodos();
    const handler = (link: any) => {
      if (link.data?.source === source && link.data?.predicate === 'ad4m://has_child') loadTodos();
      return null;
    };
    perspective.addListener('link-added', handler);
    return () => perspective.removeListener('link-added', handler);
  }, [source]);

  async function createTodo(event: React.KeyboardEvent<Element>) {
    if (event.key !== 'Enter') return;
    const todo = await Todo.create(perspective, { title });
    await perspective.add(new Link({ source, predicate: 'ad4m://has_child', target: todo.id }));
    setTitle('');
  }

  function toggleTodo({ id, done }) {
    const todo = new Todo(perspective, id);
    todo.done = done;
    todo.update();
  }

  function deleteTodo(id: string) {
    const todo = new Todo(perspective, id);
    todo.delete();
  }

  return (
    <div>
      <j-box pt="900" pb="400">
        <j-text uppercase size="300" weight="800" color="primary-500" variant="success">
          Make a new todo
        </j-text>
      </j-box>

      <input
        autoFocus
        className={styles.titleInput}
        placeholder="Write a title"
        value={title}
        onKeyDown={createTodo}
        onChange={(e) => setTitle(e.target.value)}
      ></input>

      <j-box pt="500">
        <j-flex gap="300" direction="column">
          {todos.map((todo) => (
            <j-box bg="ui-50" p="400" radius="md">
              <j-flex j="between">
                <div className={todo.done ? styles.doneTodo : ''}>
                  <j-checkbox
                    onChange={(e) => toggleTodo({ id: todo.id, done: e.target.checked })}
                    checked={todo.done}
                    style="--j-border-radius: 50%;"
                    size="sm"
                  >
                    <j-icon slot="checkmark" size="xs" name="check"></j-icon>
                    <j-text size="500" nomargin>
                      {todo.title}
                    </j-text>
                    <j-text size="500" nomargin>
                      {todo.desc}
                    </j-text>
                  </j-checkbox>
                </div>
                <j-button onClick={() => deleteTodo(todo.id)}>Delete</j-button>
              </j-flex>
            </j-box>
          ))}
        </j-flex>
      </j-box>
    </div>
  );
}
