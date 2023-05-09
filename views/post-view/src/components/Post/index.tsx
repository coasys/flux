import UIContext from "../../context/UIContext";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { getImage } from "@fluxapp/utils";
import { format, formatDistance } from "date-fns";
import { getTimeSince } from "@fluxapp/utils";
import Avatar from "../Avatar";
import CommentSection from "../CommentSection";
import { Member, Post as PostSubject } from "@fluxapp/api";
import { CommunityContext, useEntry } from "@fluxapp/react-web";
import { getMe, Me } from "@fluxapp/api";

import styles from "./index.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";

export default function Post({
  perspective,
  id,
  source,
}: {
  perspective: PerspectiveProxy;
  id: string;
  source: string;
}) {
  const { methods: UIMethods } = useContext(UIContext);
  const {
    state: { members },
  } = useContext(CommunityContext);

  const { entry: post, error } = useEntry({
    perspective: perspective,
    source,
    id,
    model: PostSubject,
  });

  const [ogData, setOgData] = useState<any>({});
  const [agent, setAgent] = useState<Me>();

  async function fetchAgent() {
    const agent = await getMe();
    setAgent(agent);
  }

  async function fetchOgData(url) {
    try {
      const data = await fetch(
        "https://jsonlink.io/api/extract?url=" + url
      ).then((res) => res.json());
      setOgData(data);
    } catch (e) {}
  }

  useEffect(() => {
    fetchAgent();

    if (post?.url) {
      fetchOgData(post.url);
    }
  }, [post?.image, post?.url]);

  if (!post) return;

  const author = members[post.author] || {};
  const isAuthor = author.did === agent.did;

  const hasTitle = post.title;
  const hasImage = post.image;
  const hasBody = post.body;
  const hasUrl = post.url;
  const hasDates = post.startDate && post.endDate;

  return (
    <div className={styles.post}>
      <j-box pb="500">
        <div className={styles.header}>
          <j-button
            size="sm"
            variant="link"
            onClick={() => UIMethods.goToFeed()}
          >
            <j-icon name="arrow-left-short" slot="start"></j-icon>
            Back
          </j-button>
          {isAuthor && (
            <div className={styles.actions}>
              <j-button
                size="xs"
                variant="subtle"
                onClick={() => UIMethods.toggleOverlay(true)}
              >
                <j-icon name="pencil" size="xs" slot="start"></j-icon>
                Edit
              </j-button>
              {/* <j-button
                size="xs"
                variant="subtle"
                onClick={() => UIMethods.toggleOverlay(true)}
              >
                <j-icon name="trash" size="xs" slot="start"></j-icon>
                Delete
              </j-button> */}
            </div>
          )}
        </div>
      </j-box>

      <j-box pt="200">
        <j-flex a="center" gap="400">
          <a href={author?.did}>
            <Avatar
              size="sm"
              did={author?.did}
              url={author?.profileThumbnailPicture}
            ></Avatar>
          </a>
          <div>
            <a className={styles.authorName} href={author.did}>
              {author?.username || (
                <j-skeleton width="lg" height="text"></j-skeleton>
              )}
            </a>
            <div className={styles.timestamp}>
              {getTimeSince(new Date(post.timestamp), new Date())}
            </div>
          </div>
        </j-flex>
      </j-box>

      {hasTitle && (
        <j-box pt="500">
          <j-text nomargin variant="heading-lg">
            {post.title}
          </j-text>
        </j-box>
      )}

      {hasImage && (
        <j-box bg="white" mt="600">
          <img className={styles.postImage} src={hasImage} />
        </j-box>
      )}

      {hasUrl && ogData?.images?.length > 0 && (
        <j-box pt="500">
          <a href={post.url} target="_blank">
            <img src={ogData?.images[0]} className={styles.postImage} />
          </a>
        </j-box>
      )}

      {hasUrl && (
        <j-box pt="400">
          <div className={styles.postUrl}>
            <j-icon size="md" name="link"></j-icon>
            <a
              onClick={(e) => e.stopPropagation()}
              href={post.url}
              target="_blank"
            >
              {new URL(post.url).origin}
            </a>
          </div>
        </j-box>
      )}

      {hasDates && (
        <j-box pt="500">
          <j-flex gap="300" direction="column">
            <div className={styles.postDate}>
              <j-icon size="xs" name="calendar-event"></j-icon>
              {format(new Date(post.startDate), "dd.MMMM HH:HH")}
            </div>
            <div className={styles.postDate}>
              <j-icon size="xs" name="clock"></j-icon>
              <j-tooltip
                title={format(new Date(post.endDate), "dd.MMMM HH:HH")}
              >
                {formatDistance(
                  new Date(post.startDate),
                  new Date(post.endDate)
                )}
              </j-tooltip>
            </div>
          </j-flex>
        </j-box>
      )}

      {hasBody && (
        <j-box pt="500">
          <div
            className={styles.postBody}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </j-box>
      )}

      <CommentSection
        perspective={perspective}
        source={post.id}
      ></CommentSection>
    </div>
  );
}
