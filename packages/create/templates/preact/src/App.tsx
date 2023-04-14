import { PerspectiveProxy } from "@perspect3vism/ad4m";
import styles from "./App.module.css";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ perspective, source }: Props) {
  return (
    <div className={styles.appContainer}>
      <div>
        <j-text variant="heading-lg">
          {perspective ? perspective.name : "Please choose a perspective"}
        </j-text>
      </div>
    </div>
  );
}
