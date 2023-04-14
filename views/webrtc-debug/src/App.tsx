import { CommunityProvider, AgentProvider } from "utils/frameworks/react";
import { UiProvider } from "./context/UiContext";
import Channel from "./components/Channel";

export default function App({ perspective, source }) {
  if (!perspective || !source) {
    return null;
  }

  return (
    <AgentProvider>
      <CommunityProvider perspectiveUuid={perspective}>
        <UiProvider>
          <Channel source={source} uuid={perspective} />
        </UiProvider>
      </CommunityProvider>
    </AgentProvider>
  );
}
