import { Community as CommunityModel } from "utils/api";
import { useEntry } from "utils/frameworks/react";
import styles from "../App.module.css";

export default function CommunityCard({ uuid }) {
  const { entry: community } = useEntry({
    perspectiveUuid: uuid,
    id: uuid,
    model: CommunityModel,
  });

  if (community) {
    return (
      <a className={styles.card} href={`/${uuid}/general`}>
        <j-avatar initials={community.name.charAt(0)}></j-avatar>
        <div>
          <j-text nomargin variant="heading">
            {community.name}
          </j-text>
          <j-text nomargin variant="heading">
            {community.description}
          </j-text>
        </div>
      </a>
    );
  }
}
