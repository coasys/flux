import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { WebRTC } from "@coasys/flux-react-web";
import { Howl } from "howler";
import { useEffect, useState } from "preact/hooks";
import guitarWav from "../../assets/guitar.wav";
import kissWav from "../../assets/kiss.wav";
import pigWav from "../../assets/pig.wav";
import popWav from "../../assets/pop.wav";
import { Reaction } from "../../types";
import Item from "./Item";

import { useMe } from "@coasys/ad4m-react-hooks";
import { Profile } from "@coasys/flux-types";
import { profileFormatter } from "@coasys/flux-utils";
import styles from "./UserGrid.module.css";

type Props = {
  webRTC: WebRTC;
  agentClient: AgentClient;
  profile?: Profile;
};

export default function UserGrid({ webRTC, profile, agentClient }: Props) {
  const [currentReaction, setCurrentReaction] = useState<Reaction>(null);
  const [focusedPeerId, setFocusedPeerId] = useState(null);
  const { me } = useMe(agentClient, profileFormatter);

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
          focused={focusedPeerId === me?.did} // profile.did
          minimised={focusedPeerId && focusedPeerId !== me?.did} // profile.did
          onToggleFocus={
            () => setFocusedPeerId(focusedPeerId === me?.did ? null : me?.did) // profile.did
          }
        />
      )}
      {peerItems}
    </div>
  );
}
