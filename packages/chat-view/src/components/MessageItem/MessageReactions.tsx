import { AgentContext } from "utils/react";
import { Reaction } from "utils/types";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import styles from "./index.scss";
import getProfile from "utils/api/getProfile";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

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

    if (reaction.authors.find((author) => author === me)) {
      const authors = reaction.authors.filter((author) => author !== me);
      if (authors.length > 2) {
        return `You, ${profiles[0].username}, ${profiles[1].username}, and ${
          authors.length - 3
        } others`;
      } else if (authors.length == 2) {
        return `You, ${profiles[0].username} and ${profiles[1].username}`;
      } else if (authors.length == 1) {
        return `You and ${profiles[0].username}`;
      } else {
        return `You`;
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
    return "";
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
      reaction.authors
        .filter((author) => author !== agentState.did)
        .slice(0, 3)
        .map((did) => getProfile(did))
    );
    setProfiles(profiles);
  }

  return (
    <j-popover event="mouseover">
      <button
        onMouseEnter={() => getProfiles()}
        class={`${styles.emojiButton} ${activeClass}`}
        onClick={() => onEmojiClick(reaction.content)}
        slot="trigger"
      >
        <span>{String.fromCodePoint(parseInt(`0x${reaction.content}`))}</span>
        <span>{reaction.count}</span>
      </button>
      <j-box slot="content" bg="ui-100">
        <j-text>
          {generateReactionText(reaction, profiles, agentState.did)}
        </j-text>
      </j-box>
    </j-popover>
  );
}
