import { CommunityProvider, AgentProvider } from "utils/react";
import AllCommunities from "./components/AllCommunities";
import Channel from "./components/Channel";

import styles from "./App.module.css";
import { UiProvider } from "./context/UiContext";

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
