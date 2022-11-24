import { useContext, useState } from "preact/hooks";
import styles from "./index.scss";
import { AgentContext } from "utils/react";
import Avatar from "../Avatar";
import CreatePost from "../CreatePost";
import { EntryType } from "utils/types";
import { postOptions } from "../../constants/options";
import ChannelContext from "utils/react/ChannelContext";

export default function Header() {
  const [initialType, setInitialType] = useState(EntryType.SimplePost);
  const { state: agentState } = useContext(AgentContext);
  const { state, methods } = useContext(ChannelContext);
  const [open, setOpen] = useState(false);

  function handlePostClick(type) {
    setInitialType(type);
    setOpen(true);
  }

  function onPublished() {
    methods.loadPosts([]);
    setOpen(false);
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
          <j-box pb="400">
            <j-flex wrap gap="200">
              {postOptions.map((option) => {
                return (
                  <j-button
                    onClick={() => handlePostClick(option.value)}
                    value="post"
                    variant="ghost"
                  >
                    <j-icon slot="start" size="sm" name={option.icon}></j-icon>
                    {option.label}
                  </j-button>
                );
              })}
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
            onPublished={onPublished}
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
