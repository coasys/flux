import { useContext, useEffect, useRef, useState } from "preact/hooks";
import styles from "./index.scss";
import createPost from "utils/api/createPost";
import { AgentContext, ChatContext, PerspectiveContext } from "utils/react";
import Avatar from "../Avatar";
import CreatePost from "../CreatePost";

export default function Header() {
  const { state: agentState } = useContext(AgentContext);
  const { state } = useContext(ChatContext);
  const [open, setOpen] = useState(false);

  console.log({ state });

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
          <j-input full size="lg" placeholder="Create a post"></j-input>
          <j-box pt="300" pb="400">
            <j-tabs value="post">
              <j-tab-item value="post" variant="button">
                <j-icon slot="start" name="card-heading"></j-icon>
                Post
              </j-tab-item>
              <j-tab-item variant="button">
                <j-icon slot="start" name="card-image"></j-icon>
                Image
              </j-tab-item>
              <j-tab-item variant="button">
                <j-icon slot="start" name="card-list"></j-icon>
                Poll
              </j-tab-item>
              <j-tab-item variant="button">
                <j-icon slot="start" name="calendar-date"></j-icon>
                Event
              </j-tab-item>
            </j-tabs>
          </j-box>
        </div>
      </j-flex>
      <j-modal open={open} onToggle={(e) => setOpen(e.target.open)}>
        <CreatePost
          communityId={state.communityId}
          channelId={state.channelId}
          onPublished={() => setOpen(false)}
        ></CreatePost>
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
