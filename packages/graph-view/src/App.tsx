import AllCommunities from "./components/AllCommunities";
import CommunityGraph from "./components/CommunityGraph";

import styles from "./App.module.css";

export default function App({ perspective, source }) {
  return (
    <div>
      {perspective ? (
        <CommunityGraph uuid={perspective} />
      ) : (
        <div className={styles.appContainer}>
          <AllCommunities />
        </div>
      )}
    </div>
  );
}
