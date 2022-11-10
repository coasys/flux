import { useContext } from "preact/hooks";
import { ChatContext } from "utils/react";
import MessageItem from "../MessageItem";
import Header from "../Header";
import "react-hint/css/index.css";
import styles from "./index.scss";

export default function MessageList({ perspectiveUuid, mainRef, channelId }) {
  const {
    state: { messages: orderedMessages },
    methods: { loadMore },
  } = useContext(ChatContext);

  const messages = [...orderedMessages.reverse()];

  function loadMoreMessages() {
    loadMore();
  }

  return (
    <div style={{ overflowY: "auto" }}>
      <Header></Header>
      {messages.map((message) => {
        return (
          <MessageItem
            key={message.id}
            message={message}
            mainRef={mainRef}
            perspectiveUuid={perspectiveUuid}
          />
        );
      })}
      <j-button onClick={() => loadMoreMessages()}>Load more</j-button>
    </div>
  );
}
