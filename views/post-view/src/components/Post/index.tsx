import UIContext from "../../context/UIContext";
import { useContext, useEffect, useState } from "preact/hooks";
import { format, formatDistance } from "date-fns";
import { getTimeSince } from "../../utils";
import Avatar from "../Avatar";
import { Post as PostSubject } from "@coasys/flux-api";
import { useAgent, useSubject, useMe } from "@coasys/flux-react-web";
import styles from "./index.module.css";
import { PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";

export default function Post({
  agent,
  perspective,
  id,
  source,
}: {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  id: string;
  source: string;
}) {
  const { methods: UIMethods } = useContext(UIContext);

  const { entry: post } = useSubject({
    perspective,
    id,
    subject: PostSubject,
  });

  const { me } = useMe(agent);

  const { profile, agent: author } = useAgent({
    client: agent,
    did: post?.author,
  });

  const [ogData, setOgData] = useState<any>({});

  async function fetchOgData(url) {
    try {
      const data = await fetch(
        "https://jsonlink.io/api/extract?url=" + url
      ).then((res) => res.json());
      setOgData(data);
    } catch (e) {}
  }

  useEffect(() => {
    if (post?.url) {
      fetchOgData(post.url);
    }
  }, [post?.url]);

  if (!post) return;

  const isAuthor = author?.did === me?.did;

  const hasTitle = post.title;
  const hasImage = post.image;
  const hasBody = post.body;
  const hasUrl = post.url;

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
              src={profile?.profileThumbnailPicture}
            ></Avatar>
          </a>
          <div>
            <a className={styles.authorName} href={author?.did}>
              {profile?.username || (
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

      {hasBody && (
        <j-box pt="500">
          <div
            className={styles.postBody}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </j-box>
      )}

      <j-box pt="800">
        <j-text size="500" color="ui-500" weight="600">
          Comments ({post.comments?.length})
        </j-text>
        <comment-section
          agent={agent}
          perspective={perspective}
          source={post.id}
        ></comment-section>
      </j-box>
    </div>
  );
}
