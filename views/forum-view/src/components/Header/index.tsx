import { useContext, useState } from "preact/hooks";
import styles from "./index.module.css";
import { AgentContext } from "utils/frameworks/react";
import Avatar from "../Avatar";
import { PostOption, postOptions } from "../../constants/options";
import UIContext from "../../context/UIContext";

export default function Header() {
  const { state: agentState } = useContext(AgentContext);
  const { methods } = useContext(UIContext);

  function handlePostClick(type) {
    methods.toggleOverlay(true, type);
  }

  return (
    <header className={styles.header}>
      <j-flex a="center" gap="500">
        <a href={agentState.did}>
          <Avatar
            size="lg"
            did={agentState.did}
            url={agentState.profile?.profileThumbnailPicture}
          ></Avatar>
        </a>
        <j-flex a="center" gap="200" style="width: 100%">
          <j-input
            onFocus={() => handlePostClick(PostOption.Text)}
            full
            size="lg"
            placeholder="Create a post"
          ></j-input>
          <j-flex a="center" gap="200">
            {postOptions
              .filter((o) => o.value !== PostOption.Text)
              .map((option) => {
                return (
                  <j-button
                    size="lg"
                    square
                    onClick={() => handlePostClick(option.value)}
                    value={PostOption.Text}
                    variant="ghost"
                  >
                    <j-icon slot="start" size="md" name={option.icon}></j-icon>
                  </j-button>
                );
              })}
          </j-flex>
        </j-flex>
      </j-flex>

      <j-button
        onClick={() => handlePostClick()}
        className={styles.addButton}
        size="lg"
        icon="plus"
        variant="primary"
      >
        New Post
        <j-icon slot="end" size="sm" name="chat"></j-icon>
      </j-button>
    </header>
  );
}
