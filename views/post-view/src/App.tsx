import PostList from "./components/PostList";
import { CommunityProvider, AgentProvider } from "@fluxapp/react-web";
import UIContext, { UIProvider, View } from "./context/UIContext";
import styles from "./index.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { ChannelProvider } from "@fluxapp/react-web";
import Header from "./components/Header";
import { useContext } from "preact/hooks";
import Post from "./components/Post";
import Overlay from "./components/Overlay/Overlay";
import "@fluxapp/ui/dist/main.d.ts";

function Feed({ perspective, source }) {
  return (
    <>
      <Header></Header>
      <PostList perspective={perspective} source={source} />
    </>
  );
}

function Main({
  perspective,
  source,
}: {
  perspective: PerspectiveProxy;
  source: string;
}) {
  const { state: UIState } = useContext(UIContext);

  switch (UIState.view) {
    case View.Feed:
      return <Feed perspective={perspective} source={source}></Feed>;
    case View.Post:
      return (
        UIState.currentPost && (
          <Post
            perspective={perspective}
            source={source}
            id={UIState.currentPost}
          ></Post>
        )
      );
  }
}

export default function App({
  perspective,
  source,
}: {
  perspective: PerspectiveProxy;
  source: string;
}) {
  if (!perspective?.uuid || !source) {
    return null;
  }

  return (
    <UIProvider communityId={perspective} channelId={source}>
      <AgentProvider>
        <CommunityProvider perspective={perspective}>
          <ChannelProvider communityId={perspective} channelId={source}>
            <div className={styles.container}>
              <Main perspective={perspective} source={source}></Main>
            </div>
            <Overlay perspective={perspective} source={source} />
          </ChannelProvider>
        </CommunityProvider>
      </AgentProvider>
    </UIProvider>
  );
}
