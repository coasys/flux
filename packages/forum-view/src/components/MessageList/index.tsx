import { useEffect, useState } from "preact/hooks";
import Header from "../Header";
import getPosts from "utils/api/getPosts";
import { checkUpdateSDNAVersion } from "utils/api/updateSDNA";
import { EntryType } from "utils/types";
import SimplePost from "../Posts/SimplePost";
import ImagePost from "../Posts/ImagePost";
import style from "./index.scss";

export default function MessageList({ perspectiveUuid, channelId }) {
  const [posts, setPosts] = useState([]);

  async function loadMoreMessages(source: string, fromDate?: Date) {
    try {
      const posts = await getPosts(perspectiveUuid, source, fromDate);
      console.log({ posts });
      setPosts(posts);
      if (posts.length > 0) {
        await checkUpdateSDNAVersion(perspectiveUuid, posts[0].timestamp);
      }
    } catch (e) {
      if (e.message.includes("existence_error")) {
        console.error(
          "We dont have the SDNA to make this query, please wait for community to sync"
        );
        await checkUpdateSDNAVersion(perspectiveUuid, new Date());
        throw e;
      } else {
        throw e;
      }
    }
  }

  useEffect(() => {
    if (channelId && perspectiveUuid) {
      loadMoreMessages(channelId);
    }
  }, [channelId, perspectiveUuid]);

  return (
    <div className={style.messageList}>
      <Header></Header>
      <div className={style.posts}>{posts.map(renderPosts)}</div>
      <j-flex a="center" j="center">
        <j-button variant="link" onClick={() => loadMoreMessages(channelId)}>
          Load more
        </j-button>
      </j-flex>
    </div>
  );
}

function renderPosts(post) {
  if (post.types.includes(EntryType.SimplePost)) {
    return <SimplePost post={post}></SimplePost>;
  }
  if (post.types.includes(EntryType.ImagePost)) {
    return <ImagePost post={post}></ImagePost>;
  }
}
