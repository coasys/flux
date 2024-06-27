import { useSubjects } from "@coasys/ad4m-react-hooks";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Message, Post } from "@coasys/flux-api";
import { isEqual } from "lodash";
import { useEffect, useState } from "preact/hooks";
import Item from "../Item";
import { transformItem } from "./../../utils";
import styles from "./SynergyDemoView.module.css";
// import { PerspectiveProxy } from "@coasys/ad4m";

type Props = {
  perspective: any; // PerspectiveProxy;
  source: string;
  agent: AgentClient;
};

export default function SynergyDemoView({ perspective, agent, source }: Props) {
  const [openAIKey, setOpenAIKey] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const { entries: messages } = useSubjects({
    perspective,
    source,
    subject: Message,
  });
  const { entries: posts } = useSubjects({
    perspective,
    source,
    subject: Post,
  });
  const { entries: tasks } = useSubjects({
    perspective,
    source,
    subject: "Task",
  });

  useEffect(() => {
    // aggregate all items into array and sort by date
    const newItems = [
      ...messages.map((message) => transformItem("Message", message)),
      ...posts.map((post) => transformItem("Post", post)),
      ...tasks.map((task) => transformItem("Task", task)),
    ].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    // compare previous and new items before updating state to prevent infinite render loop
    setItems((prevItems) => {
      if (!isEqual(prevItems, newItems)) return newItems;
      return prevItems;
    });
  }, [messages, posts, tasks]);

  return (
    <div className={styles.container}>
      <j-box pt="900" pb="400">
        <j-text uppercase size="500" weight="800" color="primary-500">
          Synergy Demo
        </j-text>
        <j-box mb="400">
          <j-input
            label="OpenAI Key"
            value={openAIKey}
            placeholder="Required to process content..."
            onChange={(e) =>
              setOpenAIKey((e.target as HTMLTextAreaElement).value)
            }
          ></j-input>
        </j-box>
        <j-flex direction="column" gap="400">
          {items.map((item) => (
            <Item
              perspective={perspective}
              source={source}
              item={item}
              openAIKey={openAIKey}
            />
          ))}
        </j-flex>
      </j-box>
    </div>
  );
}
