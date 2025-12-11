import { PerspectiveProxy } from '@coasys/ad4m';
import { AgentClient } from '@coasys/ad4m/lib/src/agent/AgentClient';
import { Profile, SignallingService } from '@coasys/flux-types';
import '@coasys/flux-ui/dist/main.d.ts';
import styles from './App.module.css';
import SynergyDemoView from './components/SynergyDemoView';

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  appStore: any;
  aiStore: any;
  signallingService: SignallingService;
  getProfile: (did: string) => Promise<Profile>;
};

export default function App(props: Props) {
  if (!props.perspective?.uuid || !props.agent) return 'No perspective or agent client';
  return (
    <div className={styles.appContainer}>
      <SynergyDemoView {...props} />
    </div>
  );
}
