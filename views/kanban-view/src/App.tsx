import { PerspectiveProxy } from '@coasys/ad4m';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import { Profile } from '@coasys/flux-types';
import styles from './App.module.css';
import Board from './components/Board';

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  getProfile: (did: string) => Promise<Profile>;
};

export default function App({ agent, perspective, source, getProfile }: Props) {
  if (!perspective?.uuid || !agent) return 'No perspective or agent client';

  return (
    <div className={styles.appContainer}>
      <Board agent={agent} perspective={perspective} source={source} getProfile={getProfile} />
    </div>
  );
}
