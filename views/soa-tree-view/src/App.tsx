import styles from './App.module.css';
import { PerspectiveProxy } from '@coasys/ad4m';
import SoATreeView from './components/SoATreeView';
import '@coasys/flux-ui/dist/main.css';

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ perspective, source }: Props) {
  if (!perspective?.uuid || !source) {
    return (
      <div className={styles.appContainer}>
        <div className={styles.error}>
          No perspective or source available
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
