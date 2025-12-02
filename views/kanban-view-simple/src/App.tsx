import { PerspectiveProxy } from '@coasys/ad4m';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import { Profile } from '@coasys/flux-types';
import styles from './App.module.scss';
import Board from './components/Board';
import { useEffect } from 'react';
import { Task, TaskBoard, TaskColumn } from '@coasys/flux-api';

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  getProfile: (did: string) => Promise<Profile>;
};

export default function App({ agent, perspective, source, getProfile }: Props) {
  if (!perspective?.uuid || !agent) return 'No perspective or agent client';

  async function ensureSDNA() {
    await Promise.all([
      perspective.ensureSDNASubjectClass(TaskBoard),
      perspective.ensureSDNASubjectClass(TaskColumn),
      perspective.ensureSDNASubjectClass(Task),
    ]);
  }

  useEffect(() => {
    ensureSDNA();
  }, [perspective]);

  return (
    <div className={styles.appContainer}>
      <Board agent={agent} perspective={perspective} channelId={source} getProfile={getProfile} />
    </div>
  );
}
