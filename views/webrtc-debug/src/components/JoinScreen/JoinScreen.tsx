import { useEffect, useRef, useState } from "preact/hooks";
import { Profile } from "utils/types";
import getProfile from "utils/api/getProfile";
import { Me } from "utils/api/getMe";
import { WebRTC } from "../../hooks/useWebrtc";
import sprites from "../../sprites";

import User from "../User";

import styles from "./JoinScreen.module.css";

type Props = {
  webRTC: WebRTC;
  currentUser?: Me;
};

export default function JoinScreen({ webRTC, currentUser }: Props) {
  const videoRef = useRef(null);
  const [profile, setProfile] = useState<Profile>();
  const [selectedSpriteIndex, setSelectedSpriteIndex] = useState(0);

  const onNextSprite = () => {
    const isLast = selectedSpriteIndex === sprites.frames.length - 1;
    setSelectedSpriteIndex(isLast ? 0 : selectedSpriteIndex + 1);
  };

  const onPrevSprite = () => {
    const isFirst = selectedSpriteIndex === 0;
    setSelectedSpriteIndex(
      isFirst ? sprites.frames.length - 1 : selectedSpriteIndex - 1
    );
  };

  // Get user details
  useEffect(() => {
    async function fetchAgent() {
      const profileResponse = await getProfile(currentUser?.did);
      setProfile(profileResponse);
    }

    if (!profile && currentUser) {
      fetchAgent();
    }
  }, [profile, currentUser]);

  useEffect(() => {
    if (videoRef.current && webRTC.localStream) {
      videoRef.current.srcObject = webRTC.localStream;
      videoRef.current.muted = true;
    }
  }, [videoRef, webRTC.localStream]);

  return (
    <j-flex a="center" direction="column">
      <h1>Create your debugger</h1>

      <j-box pt="200">
        <div className={styles.editor}>
          <div className={styles.button}>
            <j-button
              variant="transparent"
              square
              circle
              size="lg"
              onClick={onPrevSprite}
            >
              <j-icon name="arrow-left"></j-icon>
            </j-button>
          </div>

          <User
            webRTC={webRTC}
            userId={currentUser?.did}
            spriteIndex={selectedSpriteIndex}
            isLocalUser
          />
          <div className={styles.button}>
            <j-button
              variant="transparent"
              square
              circle
              size="lg"
              onClick={onNextSprite}
            >
              <j-icon name="arrow-right"></j-icon>
            </j-button>
          </div>
        </div>
      </j-box>

      <j-box pt="400">
        <j-toggle
          checked={webRTC.settings.video}
          disabled={webRTC.isLoading || !webRTC.permissionGranted}
          onChange={() =>
            webRTC.onChangeSettings({
              ...webRTC.settings,
              video: !webRTC.settings.video,
            })
          }
        >
          Join with camera!
        </j-toggle>
      </j-box>

      <j-box pt="500">
        <j-button
          variant="primary"
          size="lg"
          loading={webRTC.isLoading}
          disabled={!webRTC.permissionGranted}
          onClick={() =>
            webRTC.onJoin({ spriteIndex: selectedSpriteIndex, x: 0, y: 0 })
          }
        >
          Join room!
        </j-button>
      </j-box>

      <>
        {!webRTC.permissionGranted && (
          <j-box pt="400">
            <j-text variant="warning">
              Please allow camera/microphone access to join.
            </j-text>
          </j-box>
        )}
      </>
    </j-flex>
  );
}
