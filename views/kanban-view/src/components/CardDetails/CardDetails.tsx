import { PerspectiveProxy, Ad4mModel, SubjectProxy } from "@coasys/ad4m";
import { useModel } from "@coasys/ad4m-react-hooks";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { getProfile } from "@coasys/flux-api";
import { Profile } from "@coasys/flux-types";
import { useEffect, useState } from "preact/hooks";
import { useAssociations } from "../../hooks/useAssociations";
import Entry from "../Entry";
import styles from "./CardDetails.module.css";

type Props = {
  task: Ad4mModel;
  perspective: PerspectiveProxy;
  channelId: string;
  selectedClass: string;
  agent: AgentClient;
  allProfiles: ()=>Promise<Profile[]>;
  onDeleted: () => void;
};

export default function CardDetails({
  agent,
  task,
  selectedClass,
  onDeleted = () => {},
  perspective,
  channelId,
  allProfiles,
}: Props) {
  const [showAssign, setShowAssign] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  async function fetchProfiles() {
    setProfiles(await allProfiles());
  }

  useEffect(() => {
    if (perspective.sharedUrl) {
      fetchProfiles();
    }
  }, [perspective.uuid]);

  async function onDelete() {
    try {
      task.delete();
      onDeleted();
    } catch (e) {
      // Todo: error handling
      console.log(e);
    }
  }

  function toggleAssignee(val: boolean, did: string) {
    if (val) {
      // @ts-ignore
      if (!task.assignees.includes(did)) {
        // @ts-ignore
        task.assignees.push(did);
      }
      // @ts-ignore
      task.update();
    } else {
      // @ts-ignore
      task.assignees = task.assignees.filter((d) => d !== did);
      // @ts-ignore
      task.update();
    }
  }

  const assignedProfiles = profiles.filter((p) =>
    // @ts-ignore
    task.assignees.some((l) => l === p.did)
  );

  return (
    <div className={styles.cardDetails}>
      <div className={styles.cardMain}>
        <j-box pb="800">
          <Entry
            task={task}
            perspective={perspective}
            selectedClass={selectedClass}
            channelId={channelId}
          />
        </j-box>

        <j-box pb="500">
          <j-flex a="center" gap="300">
            <j-icon size="xs" color="ui-500" name="chat-left"></j-icon>
            <j-text nomargin size="500" weight="700">
              Comments
            </j-text>
          </j-flex>
        </j-box>
        <comment-section
          className={styles.commentSection}
          perspective={perspective}
          source={task.baseExpression}
          agent={agent}
        ></comment-section>
      </div>
      <aside className={styles.cardSidebar}>
        <j-box pt="800">
          <j-text variant="label" nomargin>
            Add to card
          </j-text>
        </j-box>
        <j-box pt="300">
          <button
            className={styles.actionButton}
            onClick={() => setShowAssign(!showAssign)}
          >
            <j-icon name="people" slot="start" size="xs"></j-icon>
            <span>Assign</span>
          </button>
          {showAssign && (
            <j-menu className={styles.menu}>
              <j-box p="200">
                <j-input size="sm" type="search">
                  <j-icon
                    name="search"
                    slot="start"
                    color="ui-500"
                    size="xs"
                  ></j-icon>
                </j-input>
                <j-box pt="300">
                  {profiles.map((profile) => (
                    <j-menu-item key={profile.did}>
                      <j-checkbox
                        full
                        checked={task.assignees.some(
                          (a) => a === profile.did
                        )}
                        onChange={(e) =>
                          toggleAssignee(e.target.checked, profile.did)
                        }
                        size="sm"
                        slot="start"
                      >
                        <div className={styles.suggestion}>
                          <j-avatar
                            size="xs"
                            src={profile.profileThumbnailPicture}
                            hash={profile.did}
                          ></j-avatar>
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
                    <j-avatar
                      size="xs"
                      src={p?.profileThumbnailPicture}
                      hash={p.did}
                    ></j-avatar>
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
