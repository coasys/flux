import { Ad4mModel, PerspectiveProxy } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-react-hooks";
import { Message } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { useEffect, useState } from "preact/hooks";
import styles from "./Card.module.css";

type Props = {
  task: Ad4mModel;
  onClick: () => void;
  perspective: PerspectiveProxy;
  getProfile: (did: string) => Promise<Profile>;
};

export default function Card({ task, onClick, perspective, getProfile }: Props) {
  const [assignedProfiles, setAssignedProfiles] = useState<Profile[]>([]);
  console.log("task", task);

  const { entries: comments } = useModel({
    perspective,
    model: Message,
    query: { source: task.baseExpression },
  });

  console.log("comments", comments);

  async function fetchProfiles() {
    // @ts-ignore
    console.log("fetching profiles", task.assignees);
    // @ts-ignore
    if (!task.assignees) {
      console.log("no assignees");
      setAssignedProfiles([]);
      return;
    }

    const profiles = await Promise.all(
      // @ts-ignore
      task.assignees?.map((l) => getProfile(l))
    );
    setAssignedProfiles(profiles);
  }

  useEffect(() => {
    fetchProfiles();
    // @ts-ignore
  }, [task.assignees?.length]);

  return (
    <div className={styles.card} onClick={onClick}>
      <j-text size="500" color="ui-800" nomargin>
        {/* @ts-ignore */}
        {task?.name || task?.title || "<Unnamed>"}
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
                <j-avatar key={p.did} size="xs" src={p?.profileThumbnailPicture} hash={p.did}></j-avatar>
              ))}
            </j-flex>
          </j-box>
        )}
      </j-flex>

      <j-icon color="ui-400" className={styles.editIcon} size="xs" name="pencil-square"></j-icon>
    </div>
  );
}
