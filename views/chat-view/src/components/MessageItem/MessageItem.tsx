import { AgentClient } from "@perspect3vism/ad4m/lib/src/agent/AgentClient";
import { Message } from "@fluxapp/api";
import { useAgent } from "@fluxapp/react-web";
import styles from "./MessageItem.module.css";

export default function MessageItem({
  agent,
  message,
}: {
  agent: AgentClient;
  message: Message;
}) {
  const { profile } = useAgent({ client: agent, did: message.author });

  return (
    <j-flex gap="400">
      <j-box>
        <j-avatar
          size="md"
          src={profile?.profileThumbnailPicture}
          hash={message.author}
        ></j-avatar>
      </j-box>
      <j-flex gap="300" direction="column">
        <j-flex a="center" gap="300">
          <a href={message.author} className={styles.username}>
            {profile?.username}
          </a>
          <j-text nomargin size="300">
            <j-timestamp relative value={message.timestamp}></j-timestamp>
          </j-text>
        </j-flex>
        <j-box>
          <j-text
            size="500"
            color="ui-800"
            dangerouslySetInnerHTML={{ __html: message.body }}
          ></j-text>
        </j-box>
      </j-flex>
    </j-flex>
  );
}
