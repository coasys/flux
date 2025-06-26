import { Ad4mModel, PerspectiveProxy } from "@coasys/ad4m";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Profile } from "@coasys/flux-types";
import { useMemo, useState } from "preact/hooks";
import Entry from "../Entry";
import styles from "./CardDetails.module.css";

type Props = {
  task: Ad4mModel & { assignees: string[] };
  perspective: PerspectiveProxy;
  channelId: string;
  selectedClass: string;
  agent: AgentClient;
  agentProfiles: Profile[];
  onDeleted: () => void;
};

export default function CardDetails({
  agent,
  task,
  selectedClass,
  onDeleted = () => {},
  perspective,
  agentProfiles,
}: Props) {
  const [showAssign, setShowAssign] = useState(false);

  const assignedProfiles = useMemo(() => {
    const assigneeSet = new Set(task.assignees);
    return agentProfiles.filter((p) => assigneeSet.has(p.did));
  }, [task.assignees, agentProfiles]);

  async function onDelete() {
    try {
      task.delete();
      onDeleted();
    } catch (error) {
      console.log("Error deleting task", error);
    }
  }

  function toggleAssignee(toggleOn: boolean, did: string) {
    if (toggleOn) {
      if (!task.assignees.includes(did)) task.assignees.push(did);
      task.update();
    } else {
      task.assignees = task.assignees.filter((d) => d !== did);
      task.update();
    }
  }

  return (
    <div className={styles.cardDetails}>
      <div className={styles.cardMain}>
        <j-box pb="800">
          <Entry task={task} perspective={perspective} selectedClass={selectedClass} />
        </j-box>

        <j-box pb="500">
          <j-flex a="center" gap="300">
            <j-icon size="xs" color="ui-500" name="chat-left"></j-icon>
            <j-text nomargin size="500" weight="700">
              Comments
            </j-text>
          </j-flex>
        </j-box>
        {/* @ts-ignore */}
        <comment-section
          className={styles.commentSection}
          perspective={perspective}
          source={task.baseExpression}
          agent={agent}
        />
      </div>
      <aside className={styles.cardSidebar}>
        <j-box pt="800">
          <j-text variant="label" nomargin>
            Add to card
          </j-text>
        </j-box>
        <j-box pt="300">
          <button className={styles.actionButton} onClick={() => setShowAssign(!showAssign)}>
            <j-icon name="people" slot="start" size="xs"></j-icon>
            <span>Assign</span>
          </button>
          {showAssign && (
            <j-menu className={styles.menu}>
              <j-box p="200">
                <j-input size="sm" type="search">
                  <j-icon name="search" slot="start" color="ui-500" size="xs"></j-icon>
                </j-input>
                <j-box pt="300">
                  {agentProfiles.map((profile) => (
                    <j-menu-item key={profile.did}>
                      <j-checkbox
                        full
                        checked={task.assignees.some((a) => a === profile.did)}
                        onChange={(e: any) => toggleAssignee(e.target.checked, profile.did)}
                        size="sm"
                        slot="start"
                      >
                        <div className={styles.suggestion}>
                          <j-avatar size="xs" src={profile.profileThumbnailPicture} hash={profile.did}></j-avatar>
                          <j-text nomargin size="400" color="ui-800">
                            {profile.username}
                          </j-text>
                        </div>
                      </j-checkbox>
                    </j-menu-item>
                  ))}
                </j-box>
              </j-box>
            </j-menu>
          )}
          {!showAssign && assignedProfiles.length > 0 && (
            <j-box pb="500">
              {assignedProfiles.map((p) => (
                <j-box pt="300" key={p.did}>
                  <j-flex a="center" gap="300">
                    <j-avatar size="xs" src={p?.profileThumbnailPicture} hash={p.did}></j-avatar>
                    <j-text nomargin size="400" color="ui-700">
                      {p?.username}
                    </j-text>
                  </j-flex>
                </j-box>
              ))}
            </j-box>
          )}
        </j-box>
        <j-box pt="300">
          <button className={styles.dangerActionButton} onClick={onDelete}>
            <j-icon name="trash" slot="start" size="xs"></j-icon>
            <span>Delete</span>
          </button>
        </j-box>
      </aside>
    </div>
  );
}
