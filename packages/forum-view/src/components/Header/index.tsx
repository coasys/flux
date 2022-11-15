import { useContext, useState } from "preact/hooks";
import styles from "./index.scss";
import { AgentContext, ChatContext } from "utils/react";
import Avatar from "../Avatar";
import CreatePost from "../CreatePost";
import { EntryType } from "utils/types";

export default function Header() {
  const [initialType, setInitialType] = useState(EntryType.SimplePost);
  const { state: agentState } = useContext(AgentContext);
  const { state } = useContext(ChatContext);
  const [open, setOpen] = useState(false);

  function handlePostClick(type) {
    setInitialType(type);
    setOpen(true);
  }

  return (
    <header class={styles.header}>
      <j-flex a="start" gap="500">
        <div>
          <Avatar
            size="lg"
            did={agentState.did}
            url={agentState.profile?.profileThumbnailPicture}
          ></Avatar>
        </div>
        <div style="display: block; width: 100%;">
          <j-input
            onFocus={() => handlePostClick(EntryType.SimplePost)}
            full
            size="lg"
            placeholder="Create a post"
          ></j-input>
          <j-box pt="300" pb="400">
            <j-flex gap="200">
              <j-button
                onClick={() => handlePostClick(EntryType.SimplePost)}
                value="post"
                variant="ghost"
              >
                <j-icon slot="start" name="card-heading"></j-icon>
                Post
              </j-button>
              <j-button
                onClick={() => handlePostClick(EntryType.ImagePost)}
                variant="ghost"
              >
                <j-icon slot="start" name="card-image"></j-icon>
                Image
              </j-button>
              <j-button
                onClick={() => handlePostClick(EntryType.PollPost)}
                variant="ghost"
              >
                <j-icon slot="start" name="card-list"></j-icon>
                Poll
              </j-button>
              <j-button
                onClick={() => handlePostClick(EntryType.CalendarEvent)}
                variant="ghost"
              >
                <j-icon slot="start" name="calendar-date"></j-icon>
                Event
              </j-button>
            </j-flex>
          </j-box>
        </div>
      </j-flex>
      <j-modal open={open} onToggle={(e) => setOpen(e.target.open)}>
        {open && (
          <CreatePost
            communityId={state.communityId}
            channelId={state.channelId}
            initialType={initialType}
            onPublished={() => setOpen(false)}
          ></CreatePost>
        )}
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
