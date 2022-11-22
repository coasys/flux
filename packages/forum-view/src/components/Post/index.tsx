import UIContext from "../../context/UIContext";
import ChannelContext from "utils/react/ChannelContext";
import CommunityContext from "utils/react/CommunityContext";
import { useContext, useState } from "preact/hooks";
import { formatRelative, format, formatDistance } from "date-fns";
import styles from "./index.scss";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { EntryType } from "utils/types";
import { createEntry } from "utils/api/createEntry";
import { BODY } from "utils/constants/communityPredicates";
import createPostReply from "utils/api/createPostReply";

export default function Post() {
  const [comment, setComment] = useState("");
  const { state: UIState, methods: UIMethods } = useContext(UIContext);
  const { state: communityState } = useContext(CommunityContext);
  const { state } = useContext(ChannelContext);
  const post = state.keyedPosts[UIState.currentPost];

  async function submitComment() {
    createPostReply({
      perspectiveUuid: state.communityId,
      postId: post.id,
      message: "Hello",
    });
  }

  const author = communityState.members[post.author] || {};
  const hasTitle = post.title;
  const hasImage = post.image;
  const hasBody = post.body;
  const hasUrl = post.url;
  const hasDates = post.startDate && post.endDate;

  return (
    <div class={styles.post}>
      <j-button variant="link" onClick={() => UIMethods.goToFeed()}>
        <j-icon name="arrow-left" slot="start"></j-icon>
        Back
      </j-button>

      {hasTitle && <j-text variant="heading">{post.title}</j-text>}
      <j-box pt="500">
        Posted by
        <span className={styles.authorName}>
          {author?.username || (
            <j-skeleton width="lg" height="text"></j-skeleton>
          )}
        </span>
        <span class={styles.timestamp}>
          {formatRelative(new Date(post.timestamp), new Date())}
        </span>
      </j-box>
      {hasDates && (
        <div class={styles.postDates}>
          <div class={styles.postDate}>
            <j-icon size="xs" name="calendar-event"></j-icon>
            {format(new Date(post.startDate), "dd.MMMM HH:HH")}
          </div>
          <div class={styles.postDate}>
            <j-icon size="xs" name="clock"></j-icon>
            <j-tooltip title={format(new Date(post.endDate), "dd.MMMM HH:HH")}>
              {formatDistance(new Date(post.startDate), new Date(post.endDate))}
            </j-tooltip>
          </div>
        </div>
      )}
      {hasBody && (
        <div
          className={styles.postBody}
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      )}
      <j-box pt="500">
        <j-flex a="center" gap="200">
          <j-icon size="xs" name="chat-left-text"></j-icon>
          <span>{post.replies.length}</span>
        </j-flex>
      </j-box>
      <div>
        <j-text variant="label">Comment</j-text>
        <div
          contenteditable
          onInput={(e: any) => setComment(e.target.value)}
        ></div>
        <j-button onClick={submitComment}>Submit</j-button>
      </div>
    </div>
  );
}
