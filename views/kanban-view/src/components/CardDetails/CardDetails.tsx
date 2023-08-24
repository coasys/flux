import { useEntry } from "@fluxapp/react-web/src";
import styles from "./CardDetails.module.css";
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import Entry from "../Entry";

type Props = {
  id: string;
  perspective: PerspectiveProxy;
  selectedClass: string;
  agent: AgentClient;
};

export default function CardDetails({
  agent,
  id,
  selectedClass,
  perspective,
}: Props) {
  const { entry } = useEntry({ perspective, id, model: selectedClass });

  const properties = Object.entries(entry || {});

  return (
    <div className={styles.cardDetails}>
      <div className={styles.cardMain}>
        <Entry
          id={id}
          perspective={perspective}
          selectedClass={selectedClass}
        ></Entry>

        <j-box pb="500">
          <j-flex a="center" gap="400">
            <j-icon size="sm" color="ui-500" name="chat-left"></j-icon>
            <j-text nomargin size="500" weight="700">
              Activity
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
      <aside className={styles.cardSidebar}></aside>
    </div>
  );
}
