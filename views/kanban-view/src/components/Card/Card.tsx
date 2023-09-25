import { useEffect, useState } from "preact/hooks";
import { useEntries, useEntry } from "@fluxapp/react-web";
import styles from "./Card.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useAssociations } from "../../hooks/useAssociations";
import { Profile } from "@fluxapp/types";
import { Message, getProfile } from "@fluxapp/api";

type Props = {
  id: string;
  onClick: () => void;
  perspective: PerspectiveProxy;
  selectedClass: string;
};

export default function Card({
  id,
  onClick,
  selectedClass,
  perspective,
}: Props) {
  const [assignedProfiles, setAssignedProfiles] = useState<Profile[]>([]);
  const { entry } = useEntry({ perspective, id, model: selectedClass });

  const { entries: comments } = useEntries({
    perspective,
    source: id,
    model: Message,
  });

  const { associations } = useAssociations({
    source: id,
    perspective,
    predicate: "rdf://has_assignee",
  });

  async function fetchProfiles() {
    const profiles = await Promise.all(
      associations.map((l) => getProfile(l.data.target))
    );
    setAssignedProfiles(profiles);
  }

  useEffect(() => {
    fetchProfiles();
  }, [associations.length]);

  return (
    <div className={styles.card} onClick={onClick}>
      <j-text size="500" color="ui-800" nomargin>
        {entry?.name || entry?.title || "Unnamed"}
      </j-text>

      <j-flex full a="center" j="between">
        <j-box pt="400">
          <j-flex a="center" gap="200">
            <j-icon color="ui-400" size="xs" name="chat-square"></j-icon>
            <j-text nomargin size="400" color="ui-400">
              {comments.length}
            </j-text>
          </j-flex>
        </j-box>

        {assignedProfiles.length > 0 && (
          <j-box pt="400">
            <j-flex className={styles.assignees} wrap gap="200">
              {assignedProfiles.map((p) => (
                <j-avatar
                  key={p.did}
                  size="xs"
                  src={p?.profileThumbnailPicture}
                  hash={p.did}
                ></j-avatar>
              ))}
            </j-flex>
          </j-box>
        )}
      </j-flex>

      <j-icon
        color="ui-400"
        className={styles.editIcon}
        size="xs"
        name="pencil-square"
      ></j-icon>
    </div>
  );
}
