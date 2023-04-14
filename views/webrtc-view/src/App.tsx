import { UiProvider } from "./context/UiContext";
import Channel from "./components/Channel";

import styles from "./App.module.css";

export default function App({ perspective, source }) {
  if (!perspective) return "No perspective";

  return (
    <UiProvider>
      <Channel source={source} uuid={perspective} />
    </UiProvider>
  );
}
