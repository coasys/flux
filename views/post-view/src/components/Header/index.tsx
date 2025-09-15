import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Profile } from "@coasys/flux-types";
import { useContext, useState } from "preact/hooks";
import { useEffect } from "react";
import { PostOption, postOptions } from "../../constants/options";
import UIContext from "../../context/UIContext";
import styles from "./index.module.css";

type Props = { agent: AgentClient; getProfile: (did: string) => Promise<Profile> };

export default function Header({ agent, getProfile }: Props) {
  const { methods } = useContext(UIContext);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  function handlePostClick(type) {
    methods.toggleOverlay(true, type);
  }

  async function getMyProfile() {
    const me = await agent.me();
    setMyProfile(await getProfile(me.did));
  }

  useEffect(() => {
    if (getProfile) getMyProfile();
  }, [getProfile]);

  return (
    <header className={styles.header}>
      <j-flex a="center" gap="500">
        <a href={myProfile?.did}>
          <j-avatar hash={myProfile?.did} src={myProfile?.profileThumbnailPicture || null} size="lg" />
        </a>
        <j-flex a="center" gap="200" style={{ width: "100%" }}>
          <j-input onFocus={() => handlePostClick(PostOption.Text)} full size="lg" placeholder="Create a post" />
          <j-flex a="center" gap="200">
            {postOptions
              .filter((o) => o.value !== PostOption.Text)
              .map((option) => {
                return (
                  <j-button size="lg" square onClick={() => handlePostClick(option.value)} variant="ghost">
                    <j-icon slot="start" name={option.icon} />
                  </j-button>
                );
              })}
          </j-flex>
        </j-flex>
      </j-flex>

      {/* <j-button
        onClick={() => handlePostClick(PostOption.Text)}
        className={styles.addButton}
        size="lg"
        variant="primary"
      >
        New Post
        <j-icon slot="end" size="sm" name="chat" />
      </j-button> */}
    </header>
  );
}
