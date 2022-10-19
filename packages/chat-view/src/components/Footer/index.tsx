import { ChatContext, PerspectiveContext } from "utils/react";
import { useContext } from "preact/hooks";
import UIContext from "../../context/UIContext";
import TipTap from "../TipTap";
import styles from "./index.scss";

export default function Footer({ perspectiveUuid, channelId }) {
  const {
    state: { members },
  } = useContext(PerspectiveContext);

  const {
    state: { keyedMessages },
  } = useContext(ChatContext);

  const {
    state: { currentReply },
    methods: { setCurrentReply },
  } = useContext(UIContext);

  const currentReplyMessage = keyedMessages[currentReply];
  const currentReplyProfile = members[currentReplyMessage?.author] || {};

  return (
    <footer class={styles.footer}>
      {currentReply && (
        <div class={styles.currentReply}>
          <j-text size="400" nomargin>
            Replying to @{currentReplyProfile.username}
          </j-text>
          <j-button
            onClick={() => setCurrentReply("")}
            square
            circle
            size="xs"
            variant="subtle"
          >
            <j-icon size="sm" name="x"></j-icon>
          </j-button>
        </div>
      )}
      <TipTap perspectiveUuid={perspectiveUuid} channelId={channelId} />
    </footer>
  );
}
