import { CommunityProvider, AgentProvider } from "utils/frameworks/react";
import { UiProvider } from "./context/UiContext";
import AllCommunities from "./components/AllCommunities";
import Channel from "./components/Channel";

import styles from "./App.module.css";

export default function App({ perspective, source }) {
  return (
    <>
      {perspective ? (
        <AgentProvider>
          <CommunityProvider perspectiveUuid={perspective}>
            <UiProvider>
              <Channel source={source} uuid={perspective} />
            </UiProvider>
          </CommunityProvider>
        </AgentProvider>
      ) : (
        <div className={styles.appContainer}>
          <AllCommunities />
        </div>
      )}
    </>
  );
}
