import { useEffect, useState } from "preact/hooks";
import { useEntry } from "@fluxapp/react-web/src";
import styles from "./Card.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { useAssociations } from "../../hooks/useAssociations";
import { Profile } from "@fluxapp/types";
import { getProfile } from "@fluxapp/api";

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
      <j-box pb="300">
        <j-flex wrap gap="200">
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
      <j-text size="500" color="ui-800" nomargin>
        {entry?.name || entry?.title || "Unnamed"}
      </j-text>

      <j-icon
        color="ui-400"
        className={styles.editIcon}
        size="sm"
        name="pencil"
      ></j-icon>
    </div>
  );
}
