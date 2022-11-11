import { useContext, useEffect, useRef, useState } from "preact/hooks";
import styles from "./index.scss";
import createPost from "utils/api/createPost";
import { ChatContext } from "utils/react";

export default function Header() {
  const { state } = useContext(ChatContext);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  function publish() {
    createPost({
      perspectiveUuid: state.communityId,
      source: state.channelId,
      title,
      body,
    })
      .then(() => setOpen(false))
      .catch((e) => {
        console.error(e);
      });
  }

  return (
    <header class={styles.header}>
      <j-modal size="sm" open={open} onToggle={(e) => setOpen(e.target.open)}>
        <j-box p="800">
          <j-text variant="heading-sm" nomargin>
            Create a New Post
          </j-text>
          <j-box mt="500">
            <j-flex direction="column" gap="300">
              <j-input
                onInput={(e) => setTitle(e.target.value)}
                value={title}
                ref={inputRef}
                size="xl"
                placeholder="Title"
              ></j-input>
              <j-input
                onInput={(e) => setBody(e.target.value)}
                value={body}
                size="xl"
                placeholder="Text"
              ></j-input>
            </j-flex>
          </j-box>
          <j-box mt="500">
            <j-flex direction="row" j="end" gap="300">
              <j-button size="lg" variant="link">
                Cancel
              </j-button>
              <j-button onClick={() => publish()} size="lg" variant="primary">
                Post
              </j-button>
            </j-flex>
          </j-box>
        </j-box>
      </j-modal>

      <j-button
        onClick={() => setOpen(true)}
        class={styles.addButton}
        size="lg"
        icon="plus"
        variant="primary"
      >
        New Post
        <j-icon slot="end" size="sm" name="chat"></j-icon>
      </j-button>
    </header>
  );
}
