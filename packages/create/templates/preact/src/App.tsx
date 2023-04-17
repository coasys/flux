import styles from "./App.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import TodoView from "./components/TodoView";
import "@fluxapp/ui/dist/main.d.ts";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
};

export default function App({ perspective, source }: Props) {
  return (
    <div className={styles.appContainer}>
      {perspective ? (
        <TodoView perspective={perspective} source={source}></TodoView>
      ) : (
        <j-text variant="heading-lg">Please choose a perspective first</j-text>
      )}
    </div>
  );
}
