import { WebRTC } from '@coasys/flux-react-web';
import { Howl } from 'howler';
import { useEffect, useState } from 'preact/hooks';
import guitarWav from '../../assets/guitar.wav';
import kissWav from '../../assets/kiss.wav';
import pigWav from '../../assets/pig.wav';
import popWav from '../../assets/pop.wav';
import { Reaction } from '../../types';
import Item from './Item';

import { Profile } from '@coasys/flux-types';
import styles from './UserGrid.module.css';

type Props = {
  webRTC: WebRTC;
  profile?: Profile;
  getProfile: (did: string) => Promise<Profile>;
};

export default function UserGrid({ webRTC, profile, getProfile }: Props) {
  const [currentReaction, setCurrentReaction] = useState<Reaction>(null);
  const [focusedPeerId, setFocusedPeerId] = useState(null);

  const popSound = new Howl({ src: [popWav] });
  const guitarSound = new Howl({ src: [guitarWav] });
  const kissSound = new Howl({ src: [kissWav] });
  const pigSound = new Howl({ src: [pigWav] });

  const userCount = webRTC.connections.length + (webRTC.localStream ? 1 : 0);
  const myReaction = currentReaction && currentReaction.did === profile?.did ? currentReaction : null;

  // Grid sizing
  const gridColSize =
    window.innerWidth <= 768
      ? 1
      : focusedPeerId
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

    if (newReaction.reaction === '💋' || newReaction.reaction === '😘') {
      kissSound.play();
    } else if (newReaction.reaction === '🎸') {
      guitarSound.play();
    } else if (newReaction.reaction === '🐷' || newReaction.reaction === '🐖') {
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
    .map((peer) => {
      const peerReaction = currentReaction && currentReaction.did === peer.did ? currentReaction : null;

      return (
        <Item
          key={peer.did}
          webRTC={webRTC}
          userId={peer.did}
          reaction={peerReaction}
          focused={focusedPeerId === peer.did}
          minimised={focusedPeerId && focusedPeerId !== peer.did}
          onToggleFocus={() => setFocusedPeerId(focusedPeerId === peer.did ? null : peer.did)}
          getProfile={getProfile}
        />
      );
    });

  return (
    <div className={styles.grid} style={{ '--grid-col-size': gridColSize } as any}>
      {webRTC.localStream && (
        <Item
          webRTC={webRTC}
          isMe
          mirrored={webRTC.localState.settings.video && !webRTC.localState.settings.screen}
          userId={profile?.did}
          reaction={myReaction}
          focused={focusedPeerId === profile?.did}
          minimised={focusedPeerId && focusedPeerId !== profile.did}
          onToggleFocus={() => setFocusedPeerId(focusedPeerId === profile.did ? null : profile.did)}
          getProfile={getProfile}
        />
      )}
      {peerItems}
    </div>
  );
}
