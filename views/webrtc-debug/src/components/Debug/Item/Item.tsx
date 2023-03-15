import { useState, useEffect } from "preact/hooks";
import { Peer } from "../../../types";
import { Profile } from "utils/types";
import getProfile from "utils/api/getProfile";
import { format, formatDistanceStrict } from "date-fns";

import styles from "./Item.module.css";

type Props = {
  peer: Peer;
  index: number;
};

export default function Item({ peer, index }: Props) {
  const [profile, setProfile] = useState<Profile>();
  const [loadingState, setLoadingState] = useState("");
  const [time, setTime] = useState(Date.now());

  // Rerender each second
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

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

  const sortedEvents = peer.connection.eventLog.sort((a, b) =>
    b.timeStamp.localeCompare(a.timeStamp)
  );
  const heartBeats = sortedEvents.filter((e) => e.type === "heartbeat");
  const lastHeartBeat = heartBeats.sort((a, b) =>
    b.timeStamp.localeCompare(a.timeStamp)
  )[0]?.timeStamp;

  return (
    <div className={styles.item}>
      <j-text variant="heading">
        Connection #{index} ({profile?.username || peer.did || "Unknown user"})
      </j-text>
      <j-text variant="footnote">{peer.did}</j-text>

      <div className={styles.detailsWrapper}>
        <div className={styles.row}>
          <j-text variant="label" nomargin>
            Connection state:
          </j-text>
          <span>{loadingState}</span>
        </div>

        <div className={styles.row}>
          <j-text variant="label" nomargin>
            Heartbeat received:
          </j-text>
          <span>
            {lastHeartBeat
              ? `${formatDistanceStrict(
                  new Date(),
                  new Date(lastHeartBeat)
                )} ago`
              : "never"}
          </span>
        </div>
      </div>

      <j-box pt={600}>
        <j-text variant="heading-sm">Event log</j-text>
      </j-box>

      <ul className={styles.events}>
        {sortedEvents.map((e, i) => (
          <li key={`${e.timeStamp}${e.value}${i}`}>
            <div className={styles.eventTitle}>
              <j-text variant="footnote">{e.type}</j-text>
              <j-text variant="footnote">{e.value}</j-text>
            </div>
            <j-text variant="footnote">{`${format(
              new Date(e.timeStamp),
              "HH:mm:ss"
            )}`}</j-text>
          </li>
        ))}
      </ul>
    </div>
  );
}
