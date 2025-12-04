import { PerspectiveProxy } from '@coasys/ad4m';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import { Profile } from '@coasys/flux-types';
import styles from './App.module.css';
import ChatView from './components/ChatView/ChatView';

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  threaded: string;
  element: HTMLElement;
  getProfile: (did: string) => Promise<Profile>;
};

export default function App({ agent, perspective, source, threaded, element, getProfile }: Props) {
  if (!perspective?.uuid || !agent) return <div>"No perspective or agent client"</div>;

  return (
    <div className={styles.appContainer}>
      <ChatView
        element={element}
        agent={agent}
        perspective={perspective}
        source={source}
        threaded={!!threaded}
        getProfile={getProfile}
      />
    </div>
  );
}
