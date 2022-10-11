import { AgentContext } from "utils/react";
import { Reaction } from "utils/types";
import { useContext } from "preact/hooks";
import styles from "./index.scss";

function sortReactions(reactions: Reaction[]) {
  const mapped = reactions.reduce((acc: any, reaction) => {
    const previous = acc[reaction.content] || { authors: [], count: 0 };
    return {
      ...acc,
      [reaction.content]: {
        authors: [...previous.authors, reaction.author],
        content: reaction.content,
        count: previous.count + 1,
      },
    };
  }, {});
  return Object.values(mapped);
}

export default function MessageReactions({ onEmojiClick, reactions = [] }) {
  const sortedReactions = sortReactions(reactions);

  const { state: agentState } = useContext(AgentContext);

  return (
    <div style={{ display: "flex", gap: "var(--j-space-200)" }}>
      {sortedReactions.map((reaction: any, i) => {
        const activeClass = reaction.authors.find(
          (did) => did === agentState.did
        )
          ? styles.emojiButtonActive
          : "";

        return (
          <button
            class={`${styles.emojiButton} ${activeClass}`}
            onClick={() => onEmojiClick(reaction.content)}
            key={i}
          >
            <span>
              {String.fromCodePoint(parseInt(`0x${reaction.content}`))}
            </span>
            <span>{reaction.count}</span>
          </button>
        );
      })}
    </div>
  );
}
