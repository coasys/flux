import { Channel } from "utils/api";
import { Community } from "utils/api";
import { Member } from "utils/api";
import { useEntries, useEntry } from "utils/frameworks/react";
import styles from "../App.module.css";

export default function CommunityOverview({ uuid }) {
  const { entry: community } = useEntry({
    perspectiveUuid: uuid,
    id: "",
    model: Community,
  });

  const { entries: channels } = useEntries({
    perspectiveUuid: uuid,
    model: Channel,
  });

  const { entries: members } = useEntries({
    perspectiveUuid: uuid,
    model: Member,
  });

  return (
    <div>
      <a href="/" className={styles.backButton}>
        <j-icon slot="start" name="arrow-left-short" size="lg"></j-icon>
      </a>
      <j-box pt="600" pb="400">
        <j-text nomargin variant="heading-lg">
          {community?.name}
        </j-text>
      </j-box>
      <j-box pt="600" pb="400">
        <j-text nomargin size="400" uppercase>
          Channels ({channels.length})
        </j-text>
      </j-box>
      <div className={styles.grid}>
        {channels.map((channel: Channel) => (
          <div className={styles.card}>
            <j-text variant="heading-sm"># {channel.name}</j-text>
          </div>
        ))}
      </div>
      <j-box pt="600" pb="400">
        <j-text nomargin size="400" uppercase>
          Members ({members.length})
        </j-text>
      </j-box>
      <div className={styles.grid}>
        {members.map((member: Member) => (
          <div className={styles.card}>
            <j-text variant="heading-sm">{member.did}</j-text>
          </div>
        ))}
      </div>
    </div>
  );
}
