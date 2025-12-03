import { PerspectiveProxy } from '@coasys/ad4m';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import { Profile } from '@coasys/flux-types';
import '@coasys/flux-ui/dist/main.d.ts';
import { useContext } from 'preact/hooks';
import Header from './components/Header';
import Overlay from './components/Overlay/Overlay';
import Post from './components/Post';
import PostList from './components/PostList';
import UIContext, { UIProvider, View } from './context/UIContext';
import styles from './index.module.css';

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  getProfile: (did: string) => Promise<Profile>;
};

function Feed({ agent, perspective, source, getProfile }) {
  return (
    <>
      <Header agent={agent} getProfile={getProfile} />
      <PostList agent={agent} perspective={perspective} source={source} getProfile={getProfile} />
    </>
  );
}

function Main({ agent, perspective, source, getProfile }: Props) {
  const { state: UIState } = useContext(UIContext);

  switch (UIState.view) {
    case View.Feed:
      return <Feed agent={agent} perspective={perspective} source={source} getProfile={getProfile} />;
    case View.Post:
      return (
        UIState.currentPost && (
          <Post agent={agent} perspective={perspective} id={UIState.currentPost} getProfile={getProfile} />
        )
      );
  }
}

export default function App({ agent, perspective, source, getProfile }: Props) {
  if (!perspective?.uuid || !source || !agent) {
    return null;
  }

  return (
    <UIProvider communityId={perspective} channelId={source}>
      <div className={styles.container}>
        <Main agent={agent} perspective={perspective} source={source} getProfile={getProfile} />
      </div>
      <Overlay agent={agent} perspective={perspective} source={source} />
    </UIProvider>
  );
}
