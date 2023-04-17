import styles from "./App.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import PostView from "./components/PostView";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ perspective, source }: Props) {
  return (
    <div className={styles.appContainer}>
      {perspective ? (
        <PostView perspective={perspective} source={source}></PostView>
      ) : (
        <j-text variant="heading-lg">Please choose a perspective first</j-text>
      )}
    </div>
  );
}
