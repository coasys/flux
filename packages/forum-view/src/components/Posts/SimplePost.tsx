import { useContext, useMemo, useEffect, useRef, useState } from "preact/hooks";
import { AgentContext, ChatContext, PerspectiveContext } from "utils/react";
import getMe from "utils/api/getMe";
import getNeighbourhoodLink from "utils/api/getNeighbourhoodLink";
import UIContext from "../../context/UIContext";
import styles from "./index.scss";
import { format, formatRelative } from "date-fns/esm";
import { REACTION } from "utils/constants/communityPredicates";
import EditorContext from "../../context/EditorContext";
import { Profile } from "utils/types";

export default function MessageItem({ post, mainRef, perspectiveUuid }) {
  const messageTitle = post.titles[0].content;
  const messageBody = post.bodys[0].content;

  const messageRef = useRef<any>(null);

  const {
    state: { members },
  } = useContext(PerspectiveContext);

  function onProfileClick(did: string) {
    const event = new CustomEvent("agent-click", {
      detail: { did },
      bubbles: true,
    });
    mainRef?.dispatchEvent(event);
  }

  const author: Profile = members[post.author] || {};
  const popularStyle: string = post.isPopular ? styles.popularMessage : "";

  return (
    <div class={[styles.message, popularStyle].join(" ")}>
      <div class={styles.messageItemWrapper}>
        <div class={styles.messageItemContentWrapper}>
          <header class={styles.messageItemHeader}>
            <div
              onClick={() => onProfileClick(author?.did)}
              class={styles.messageUsername}
            >
              {author?.username || (
                <j-skeleton width="xl" height="text"></j-skeleton>
              )}
            </div>
            <small
              class={styles.timestamp}
              data-rh
              data-timestamp={format(
                new Date(post.timestamp),
                "EEEE, MMMM d, yyyy, hh:mm b"
              )}
            >
              {formatRelative(new Date(post.timestamp), new Date())}
            </small>
          </header>

          <div
            className={styles.messageTitle}
            dangerouslySetInnerHTML={{
              __html: messageTitle,
            }}
          ></div>
          <div
            ref={messageRef}
            class={styles.messageItemContent}
            style={{ display: "inline-flex" }}
            dangerouslySetInnerHTML={{
              __html: messageBody,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
