import { UiProvider } from "./context/UiContext";
import Channel from "./components/Channel";

export default function App({ perspective, source, agent }) {
  if (!perspective?.uuid || !source) {
    return null;
  }

  return (
    <UiProvider>
      <Channel source={source} agent={agent} perspective={perspective} />
    </UiProvider>
  );
}
