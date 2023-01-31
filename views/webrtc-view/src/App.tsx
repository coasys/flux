import { CommunityProvider, AgentProvider } from "utils/react";
import AllCommunities from "./components/AllCommunities";
import AudioRoom from "./components/AudioRoom";

import styles from "./App.module.css";

export default function App({ perspective, source }) {
  return (
    <div>
      {perspective ? (
        <AgentProvider>
          <CommunityProvider perspectiveUuid={perspective}>
            <AudioRoom />
          </CommunityProvider>
        </AgentProvider>
      ) : (
        <div className={styles.appContainer}>
          <AllCommunities />
        </div>
      )}
    </div>
  );
}
