import PostList from "./components/PostList";
import { CommunityProvider, AgentProvider } from "@fluxapp/react-web";
import UIContext, { UIProvider, View } from "./context/UIContext";
import styles from "./index.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { ChannelProvider } from "@fluxapp/react-web";
import Header from "./components/Header";
import { useContext } from "preact/hooks";
import Post from "./components/Post";
import Overlay from "./components/Overlay/Overlay";
import "@fluxapp/ui/dist/main.d.ts";

function Feed({ agent, perspective, source }) {
  return (
    <>
      <Header agent={agent}></Header>
      <PostList perspective={perspective} source={source} />
    </>
  );
}

function Main({
  agent,
  perspective,
  source,
}: {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
}) {
  const { state: UIState } = useContext(UIContext);

  switch (UIState.view) {
    case View.Feed:
      return (
        <Feed agent={agent} perspective={perspective} source={source}></Feed>
      );
    case View.Post:
      return (
        UIState.currentPost && (
          <Post
            agent={agent}
            perspective={perspective}
            source={source}
            id={UIState.currentPost}
          ></Post>
        )
      );
  }
}

export default function App({
  agent,
  perspective,
  source,
}: {
  agent: AgentClient;
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
              <Main
                agent={agent}
                perspective={perspective}
                source={source}
              ></Main>
            </div>
            <Overlay perspective={perspective} source={source} />
          </ChannelProvider>
        </CommunityProvider>
      </AgentProvider>
    </UIProvider>
  );
}
