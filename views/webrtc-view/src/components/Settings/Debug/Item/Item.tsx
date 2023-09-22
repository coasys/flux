import { useState, useEffect } from "preact/hooks";
import { Peer } from "../../../../types";
import { Profile } from "@fluxapp/types";
import { getProfile } from "@fluxapp/api";

import styles from "./Item.module.css";

type Props = {
  peer: Peer;
  onSendSignal: (userId: string) => void;
};

export default function Item({ peer, onSendSignal }: Props) {
  const [profile, setProfile] = useState<Profile>();
  const [loadingState, setLoadingState] = useState("");

  // Get user details
  useEffect(() => {
    async function fetchAgent() {
      const profileResponse = await getProfile(peer.did);
      setProfile(profileResponse);
    }

    if (!profile) {
      fetchAgent();
    }
  }, [profile, peer.did]);

  return (
    <div className={styles.item}>
      <div className={styles.details}>
        <span>{profile?.username || peer.did || "Unknown user"}</span>
        <span>({peer?.connection?.peerConnection?.iceConnectionState})</span>
      </div>
      <div>
        <j-button
          variant="transparent"
          size="xs"
          onClick={() => onSendSignal(peer.did)}
        >
          Send signal
        </j-button>
      </div>
    </div>
  );
}
