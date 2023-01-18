import AllCommunities from "./components/AllCommunities";
import CommunityOverview from "./components/CommunityOverview";
import { useEffect } from "preact/hooks";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient } from "@perspect3vism/ad4m";
import styles from "./App.module.css";

export default function App({ perspective, source }) {
  useEffect(() => {
    const fetchsnapshot = async () => {
      const client: Ad4mClient = await getAd4mClient();
      const snapshot = await client.perspective.snapshotByUUID(perspective);
      console.log(snapshot);
    };

    fetchsnapshot();
  }, [perspective]);

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
