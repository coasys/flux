import { ChatContext, PerspectiveContext } from "utils/react";
import { useContext, useMemo, useState } from "preact/hooks";
import UIContext from "../../context/UIContext";
import TipTap from "../TipTap";
import styles from "./index.scss";

export default function Footer() {
  const {
    state: { members, channels, url, sourceUrl },
  } = useContext(PerspectiveContext);
  const [inputValue, setInputValue] = useState("");

  const {
    state: { keyedMessages },
    methods: { sendMessage, sendReply },
  } = useContext(ChatContext);

  const {
    state: { currentReply },
    methods: { setCurrentReply },
  } = useContext(UIContext);

  const currentReplyMessage = keyedMessages[currentReply];
  const currentReplyProfile = members[currentReplyMessage?.author] || {};

  function handleSendMessage(value) {
    const escapedMessage = value.replace(/( |<([^>]+)>)/gi, "");

    if (escapedMessage) {
      if (currentReplyMessage) {
        sendReply(value, currentReplyMessage.id);
      } else {
        sendMessage(value);
      }

      setInputValue("");
      setCurrentReply("");
    }
  }

  const mentionMembers = useMemo(() => {
    return Object.values(members).map((user: any) => {
      return {
        label: user.username,
        id: user.did,
        trigger: "@",
      };
    });
  }, [members]);

  const mentionChannels = useMemo(() => {
    return Object.values(channels).map((channel: any) => {
      return {
        label: channel.name,
        id: channel.id,
        trigger: "#",
      };
    });
  }, [channels]);

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
      <TipTap
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
        members={mentionMembers}
        channels={mentionChannels}
      ></TipTap>
    </footer>
  );
}
