import { useState, useEffect } from "preact/hooks";
import { Peer } from "../../../types";
import { Profile } from "utils/types";
import getProfile from "utils/api/getProfile";

import styles from "./Item.module.css";

type Props = {
  peer: Peer;
  index: number;
};

export default function Item({ peer, index }: Props) {
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

  // Get loading state
  useEffect(() => {
    setLoadingState(peer?.connection.peerConnection.iceConnectionState);

    function updateLoadingState(event) {
      setLoadingState(peer?.connection.peerConnection.iceConnectionState);
    }

    peer?.connection.peerConnection.addEventListener(
      "iceconnectionstatechange",
      updateLoadingState
    );

    return () => {
      if (peer) {
        peer?.connection?.peerConnection?.removeEventListener(
          "iceconnectionstatechange",
          updateLoadingState
        );
      }
    };
  }, [peer]);

  return (
    <div className={styles.item}>
      <j-text variant="heading">
        Connection #{index} ({profile?.username || peer.did || "Unknown user"})
      </j-text>
      <j-text variant="body">{peer.did}</j-text>

      <div className={styles.details}>
        <span>({loadingState})</span>
      </div>
    </div>
  );
}
