import styles from './App.module.css';
import { PerspectiveProxy, AgentClient } from '@coasys/ad4m';
import SoATreeView from './components/SoATreeView';
import '@coasys/flux-ui/dist/main.css';

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ agent, perspective, source }: Props) {
  if (!perspective?.uuid || !agent) {
    return (
      <div className={styles.appContainer}>
        <div className={styles.error}>
          No perspective or agent client available
        </div>
      </div>
    );
  }
  return (
    <div className={styles.appContainer}>
      <SoATreeView perspective={perspective} source={source} />
    </div>
  );
}
