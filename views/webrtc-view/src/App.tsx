import AllCommunities from "./components/AllCommunities";
import Channel from "./components/Channel";
import { UiProvider } from "./context/UiContext";

export default function App({ perspective, source }) {
  if (!perspective) return "No perspective";

  return (
    <UiProvider>
      <Channel source={source} uuid={perspective} />
    </UiProvider>
  );
}
