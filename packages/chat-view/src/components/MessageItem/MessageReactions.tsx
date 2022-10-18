import { AgentContext } from "utils/react";
import { Reaction } from "utils/types";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import styles from "./index.scss";
import getProfile from "utils/api/getProfile";
import emojiShortName from "emoji-short-name";

interface ReactionType {
  authors: string[];
  content: string;
  count: number;
}

function sortReactions(reactions: Reaction[]): ReactionType[] {
  const mapped = reactions.reduce((acc: any, reaction) => {
    const previous = acc[reaction.content] || { authors: [], count: 0 };
    return {
      ...acc,
      [reaction.content]: {
        authors: [...previous.authors, reaction.author],
        content: reaction.content,
        count: previous.count + 1,
      },
    } as ReactionType;
  }, {});
  return Object.values(mapped);
}

function generateReactionText(
  reaction: ReactionType,
  profiles: any[],
  me: string
) {
  if (profiles.length) {
    const emoji = String.fromCodePoint(parseInt(`0x${reaction.content}`));
    const shortName = `:${emojiShortName[emoji]}:`;

    if (reaction.authors.find((author) => author === me)) {
      const authors = reaction.authors.filter((author) => author !== me);
      if (authors.length > 2) {
        return `You, ${profiles[0].username}, ${profiles[1].username}, and ${
          authors.length - 3
        } others reacted with ${shortName}`;
      } else if (authors.length == 2) {
        return `You, ${profiles[0].username} and ${profiles[1].username} reacted with ${shortName}`;
      } else if (authors.length == 1) {
        return `You and ${profiles[0].username} reacted with ${shortName}`;
      } else {
        return `You reacted with ${shortName}`;
      }
    } else {
      if (reaction.authors.length > 3) {
        return `${profiles[0].username}, ${profiles[1].username}, ${
          profiles[2].username
        }, and ${reaction.authors.length - 3} others reacted with ${emoji}`;
      } else if (reaction.authors.length == 3) {
        return `${profiles[0].username}, ${profiles[1].username} and ${profiles[2].username} reacted with ${emoji}`;
      } else if (reaction.authors.length == 2) {
        return `${profiles[0].username} and ${profiles[1].username} reacted with ${emoji}`;
      } else if (reaction.authors.length == 1) {
        return `${profiles[0].username} reacted with ${emoji}`;
      }
    }
  } else {
    return null;
  }
}

export default function MessageReactions({ onEmojiClick, reactions = [] }) {
  const sortedReactions = useMemo(() => {
    return sortReactions(reactions);
  }, [reactions.length]);

  return (
    <div style={{ display: "inline-flex", gap: "var(--j-space-200)" }}>
      {sortedReactions.map((reaction: any, i) => {
        return ReactionButton({ reaction, onEmojiClick, key: i });
      })}
    </div>
  );
}

function ReactionButton({ reaction, onEmojiClick }) {
  const { state: agentState } = useContext(AgentContext);

  const activeClass = useMemo(() => {
    return reaction.authors.find((did) => did === agentState.did)
      ? styles.emojiButtonActive
      : "";
  }, [reaction.authors.length]);

  const [profiles, setProfiles] = useState([]);

  async function getProfiles() {
    const profiles = await Promise.all(
      reaction.authors.slice(0, 3).map((did) => getProfile(did))
    );

    setProfiles(profiles);
  }

  return (
    <button
      onMouseOver={() => getProfiles()}
      class={`${styles.emojiButton} ${activeClass}`}
      onClick={() => onEmojiClick(reaction.content)}
    >
      <span>{String.fromCodePoint(parseInt(`0x${reaction.content}`))}</span>
      <span>{reaction.count}</span>
      <div onClick={(e) => e.stopPropagation()} class={styles.reactionTooltip}>
        <j-text nomargin size="900">
          {String.fromCodePoint(parseInt(`0x${reaction.content}`))}
        </j-text>
        {profiles.length === 0 ? (
          <j-spinner size="sm"></j-spinner>
        ) : (
          <j-text nomargin color="black" size="400">
            {generateReactionText(reaction, profiles, agentState.did)}
          </j-text>
        )}
      </div>
    </button>
  );
}
