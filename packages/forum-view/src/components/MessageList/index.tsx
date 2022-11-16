import { useEffect, useState } from "preact/hooks";
import Header from "../Header";
import getPosts from "utils/api/getPosts";
import { checkUpdateSDNAVersion } from "utils/api/updateSDNA";
import { EntryType } from "utils/types";
import SimplePost from "../Posts/SimplePost";
import ImagePost from "../Posts/ImagePost";
import LinkPost from "../Posts/LinkPost";
import style from "./index.scss";
import {
  DisplayView,
  displayOptions,
  postOptions,
} from "../../constants/options";

export default function MessageList({ perspectiveUuid, channelId }) {
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [view, setView] = useState(DisplayView.Card);

  const sortedPosts = sortBy
    ? posts.filter((post) => post.types.includes(sortBy))
    : posts;

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

  const gridClass = view === DisplayView.Grid ? style.grid : "";
  const currentOption = displayOptions.find((o) => o.value === view);
  const orderOption = postOptions.find((o) => o.value === sortBy) || {
    label: "All",
    value: "",
    icon: "columns",
  };

  return (
    <div className={style.messageList}>
      <Header></Header>
      <j-box pb="500">
        <j-flex a="center" j="between">
          <j-popover>
            <j-button variant="ghost" slot="trigger">
              <j-icon size="sm" name={orderOption.icon}></j-icon>
              {orderOption.label}
            </j-button>
            <j-menu slot="content">
              <j-menu-item
                selected={sortBy === ""}
                onClick={() => setSortBy("")}
              >
                <j-icon size="sm" slot="start" name="columns"></j-icon>
                All
              </j-menu-item>
              {postOptions.map((option) => {
                return (
                  <j-menu-item
                    selected={option.value === sortBy}
                    onClick={() => setSortBy(option.value)}
                  >
                    <j-icon size="sm" slot="start" name={option.icon}></j-icon>
                    {option.label}
                  </j-menu-item>
                );
              })}
            </j-menu>
          </j-popover>
          <j-popover>
            <j-button variant="ghost" slot="trigger">
              <j-icon size="sm" name={currentOption.icon}></j-icon>
              <j-icon size="xs" name="chevron-down"></j-icon>
            </j-button>
            <j-menu slot="content">
              {displayOptions.map((option) => {
                return (
                  <j-menu-item
                    selected={option.value === view}
                    onClick={() => setView(option.value)}
                  >
                    <j-icon size="sm" slot="start" name={option.icon}></j-icon>
                    {option.label}
                  </j-menu-item>
                );
              })}
            </j-menu>
          </j-popover>
        </j-flex>
      </j-box>
      <div className={[style.posts, gridClass].join(" ")}>
        {sortedPosts.map(renderPosts)}
      </div>
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
  if (post.types.includes(EntryType.LinkPost)) {
    return <LinkPost post={post}></LinkPost>;
  }
}
