import { useEffect, useState } from "preact/hooks";
import { Howl } from "howler";
import { Reaction } from "../../types";
import { WebRTC } from "@coasys/flux-react-web";
import popWav from "../../assets/pop.wav";
import guitarWav from "../../assets/guitar.wav";
import kissWav from "../../assets/kiss.wav";
import pigWav from "../../assets/pig.wav";
import Item from "./Item";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";

import styles from "./UserGrid.module.css";
import { Profile } from "@coasys/flux-types";
import { useMe } from "@coasys/ad4m-react-hooks";
import { profileFormatter } from "@coasys/flux-utils";

type Props = {
  webRTC: WebRTC;
  agentClient: AgentClient;
  profile?: Profile;
};

export default function UserGrid({ webRTC, profile, agentClient }: Props) {
  const [currentReaction, setCurrentReaction] = useState<Reaction>(null);
  const [focusedPeerId, setFocusedPeerId] = useState(null);
  const {me} = useMe(agentClient, profileFormatter);

  const popSound = new Howl({
    src: [popWav],
  });
  const guitarSound = new Howl({
    src: [guitarWav],
  });
  const kissSound = new Howl({
    src: [kissWav],
  });
  const pigSound = new Howl({
    src: [pigWav],
  });

  const userCount = webRTC.connections.length + (webRTC.localStream ? 1 : 0);
  const myReaction =
    currentReaction && currentReaction.did === profile?.did
      ? currentReaction
      : null;

  // Grid sizing

  const gridColSize = focusedPeerId
    ? 1
    : userCount === 1
      ? 1
      : userCount > 1 && userCount <= 4
        ? 2
        : userCount > 4 && userCount <= 9
          ? 3
          : 4;

  useEffect(() => {
    if (webRTC.reactions.length < 1) {
      return;
    }

    const newReaction = webRTC.reactions[webRTC.reactions.length - 1];

    if (newReaction.reaction === "💋" || newReaction.reaction === "😘") {
      kissSound.play();
    } else if (newReaction.reaction === "🎸") {
      guitarSound.play();
    } else if (newReaction.reaction === "🐷" || newReaction.reaction === "🐖") {
      pigSound.play();
    } else {
      popSound.play();
    }

    setCurrentReaction(newReaction);
    const timeOutId = setTimeout(() => setCurrentReaction(null), 3500);
    return () => clearTimeout(timeOutId);
  }, [webRTC.reactions]);

  // Build participant elements
  const peerItems = webRTC.connections
    .sort((a, b) => a.did.localeCompare(b.did))
    .map((peer, index) => {
      const peerReaction =
        currentReaction && currentReaction.did === peer.did
          ? currentReaction
          : null;

      return (
        <Item
          key={peer.did}
          webRTC={webRTC}
          userId={peer.did}
          agentClient={agentClient}
          reaction={peerReaction}
          focused={focusedPeerId === peer.did}
          minimised={focusedPeerId && focusedPeerId !== peer.did}
          onToggleFocus={() =>
            setFocusedPeerId(focusedPeerId === peer.did ? null : peer.did)
          }
        />
      );
    });

    console.log("peer 1111", profile);

  return (
    <div
      className={styles.grid}
      style={{
        "--grid-col-size": gridColSize,
      }}
    >
      {webRTC.localStream && (
        <Item
          webRTC={webRTC}
          isMe
          agentClient={agentClient}
          mirrored={
            webRTC.localState.settings.video &&
            !webRTC.localState.settings.screen
          }
          userId={me?.did}
          reaction={myReaction}
          focused={focusedPeerId === profile.did}
          minimised={focusedPeerId && focusedPeerId !== profile.did}
          onToggleFocus={() =>
            setFocusedPeerId(focusedPeerId === profile.did ? null : profile.did)
          }
        />
      )}
      {peerItems}
    </div>
  );
}
