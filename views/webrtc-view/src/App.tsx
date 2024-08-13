import Channel from "./components/Channel";
import { UiProvider } from "./context/UiContext";

export default function App({
  perspective,
  source,
  agent,
  currentView,
  setModalOpen,
}) {
  if (!perspective?.uuid || !source) {
    return null;
  }

  return (
    <UiProvider>
      <Channel
        source={source}
        agent={agent}
        perspective={perspective}
        currentView={currentView}
        setModalOpen={setModalOpen}
      />
    </UiProvider>
  );
}
