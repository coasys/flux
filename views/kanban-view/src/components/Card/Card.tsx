import { Ad4mModel, PerspectiveProxy } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-react-hooks";
import { Message } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { useMemo } from "preact/hooks";
import styles from "./Card.module.css";

type Props = {
  task: Ad4mModel & { assignees: string[]; name?: string; title?: string };
  onClick: () => void;
  perspective: PerspectiveProxy;
  agentProfiles: Profile[];
};

export default function Card({ task, onClick, perspective, agentProfiles }: Props) {
  const assignedProfiles = useMemo(() => {
    const assigneeSet = new Set(task.assignees);
    return agentProfiles.filter((p) => assigneeSet.has(p.did));
  }, [task.assignees, agentProfiles]);

  const { entries: comments } = useModel({
    perspective,
    model: Message,
    query: { source: task.baseExpression },
  });

  return (
    <div className={styles.card} onClick={onClick}>
      <j-text size="500" color="ui-800" nomargin>
        {task?.name || task?.title || "<Unnamed>"}
      </j-text>

      <j-flex a="center" j="between">
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
                <j-avatar key={p.did} size="xs" src={p?.profileThumbnailPicture} hash={p.did} />
              ))}
            </j-flex>
          </j-box>
        )}
      </j-flex>

      <j-icon color="ui-400" className={styles.editIcon} size="xs" name="pencil-square" />
    </div>
  );
}
