import { useState } from "preact/hooks";
import { useEntry } from "@fluxapp/react-web/src";
import styles from "./CardDetails.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import Entry from "../Entry";
import { useEffect } from "preact/hooks";
import { Profile } from "@fluxapp/types";
import { getProfile } from "@fluxapp/api";

type Props = {
  id: string;
  perspective: PerspectiveProxy;
  selectedClass: string;
  agent: AgentClient;
  onDeleted: () => void;
};

export default function CardDetails({
  agent,
  id,
  selectedClass,
  onDeleted = () => {},
  perspective,
}: Props) {
  const { entry, model } = useEntry({ perspective, id, model: selectedClass });

  const [showAssign, setShowAssign] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  async function fetchProfiles() {
    const n = await perspective.getNeighbourhoodProxy();
    const dids = await n.otherAgents();
    const me = await agent.me();
    const allAgents = [me.did, ...dids];
    const profiles = await Promise.all(allAgents.map((d) => getProfile(d)));
    setProfiles(profiles);
  }

  useEffect(() => {
    if (perspective.sharedUrl) {
      fetchProfiles();
    }
  }, [perspective.uuid]);

  async function onDelete() {
    try {
      await model.remove(entry.id);
      onDeleted();
    } catch (e) {
      // Todo: error handling
      console.log(e);
    }
  }

  console.log({ profiles, showAssign });

  return (
    <div className={styles.cardDetails}>
      <div className={styles.cardMain}>
        <j-box pb="800">
          <Entry
            id={id}
            perspective={perspective}
            selectedClass={selectedClass}
          ></Entry>
        </j-box>

        <j-box pb="500">
          <j-flex a="center" gap="400">
            <j-icon size="sm" color="ui-500" name="chat-left"></j-icon>
            <j-text nomargin size="500" weight="700">
              Comments
            </j-text>
          </j-flex>
        </j-box>
        <comment-section
          className={styles.commentSection}
          perspective={perspective}
          source={id}
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
                      <j-checkbox size="sm" slot="start">
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
