import { UiProvider } from "./context/UiContext";
import Channel from "./components/Channel";

export default function App({ perspective, source }) {
  if (!perspective || !source) {
    return null;
  }

  return (
    <UiProvider>
      <Channel source={source} uuid={perspective} />
    </UiProvider>
  );
}
