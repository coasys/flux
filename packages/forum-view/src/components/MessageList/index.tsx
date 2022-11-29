import { useContext, useEffect, useState } from "preact/hooks";
import PostItem from "../PostItem";
import style from "./index.scss";
import {
  DisplayView,
  displayOptions,
  postOptions,
} from "../../constants/options";
import ChannelContext from "utils/react/ChannelContext";
import PostModel from "utils/api/post";

export default function MessageList() {
  const [sortBy, setSortBy] = useState("");
  const [view, setView] = useState(DisplayView.Compact);

  const { state, methods } = useContext(ChannelContext);

  const sortedPosts = sortBy
    ? state.posts.filter((post) => post.types.includes(sortBy))
    : state.posts;

  useEffect(() => {
    if (state.channelId && state.communityId) {
      const Post = new PostModel({
        perspectiveUuid: state.communityId,
        source: state.channelId,
      });
      Post.getAll().then(() => console.log("loaded"));
      methods.loadPosts([]);
    }
  }, [state.channelId, state.communityId]);

  const gridClass = view === DisplayView.Grid ? style.grid : "";
  const currentOption = displayOptions.find((o) => o.value === view);
  const orderOption = postOptions.find((o) => o.value === sortBy) || {
    label: "All",
    value: "",
    icon: "columns",
  };

  return (
    <div className={style.messageList}>
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
        {sortedPosts
          .filter((post) => post.id.startsWith("flux_entry://"))
          .map((post) => (
            <PostItem post={post} displayView={view}></PostItem>
          ))}
      </div>
      <j-flex a="center" j="center">
        <j-button variant="link" onClick={() => methods.loadPosts([])}>
          Load more
        </j-button>
      </j-flex>
    </div>
  );
}
