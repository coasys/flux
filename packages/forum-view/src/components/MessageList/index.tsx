import { useContext, useEffect, useState } from "preact/hooks";
import MessageItem from "../MessageItem";
import Header from "../Header";
import "react-hint/css/index.css";
import getPosts from "utils/api/getPosts";

export default function MessageList({ perspectiveUuid, mainRef, channelId }) {
  const [posts, setPosts] = useState([]);

  async function loadMoreMessages(source: string, fromDate?: Date) {
    const posts = await getPosts(perspectiveUuid, source, fromDate);
    setPosts(posts);
  }

  useEffect(() => {
    console.log("fetcing onn first load");
    if (channelId && perspectiveUuid) {
      loadMoreMessages(channelId);
    }
  }, [channelId, perspectiveUuid]);

  return (
    <div style={{ overflowY: "auto" }}>
      <Header></Header>
      {posts.map((post) => {
        return (
          <MessageItem
            key={post.id}
            message={post}
            mainRef={mainRef}
            perspectiveUuid={perspectiveUuid}
          />
        );
      })}
      <j-flex a="center" j="center">
        <j-button variant="link" onClick={() => loadMoreMessages(channelId)}>
          Load more
        </j-button>
      </j-flex>
    </div>
  );
}
