import AllCommunities from "./components/AllCommunities";
import CommunityOverview from "./components/CommunityOverview";
import styles from "./App.module.css";

export default function App({ perspective, source }) {
  return (
    <div className={styles.appContainer}>
      {perspective ? (
        <CommunityOverview uuid={perspective} />
      ) : (
        <AllCommunities />
      )}
    </div>
  );
}
