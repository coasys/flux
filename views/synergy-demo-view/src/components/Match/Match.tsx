import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Message, Post } from "@coasys/flux-api";
import { useAgent } from "@coasys/flux-react-web";
import { profileFormatter, transformItem } from "@coasys/flux-utils";
import { isEqual } from "lodash";
import { useEffect, useState } from "preact/hooks";
import Avatar from "../Avatar";
import styles from "./Match.module.scss";

type Props = {
  perspective: any;
  agent: any;
  match: any;
};

export default function Match({ perspective, agent, match }: Props) {
  const { itemId, channel, similarity, relevance } = match;

  const [items, setItems] = useState<any[]>([]);
  const [item, setItem] = useState<any>(null);

  const { entries: messages } = useSubjects({
    perspective,
    source: channel.id,
    subject: Message,
  });
  const { entries: posts } = useSubjects({
    perspective,
    source: channel.id,
    subject: Post,
  });
  const { entries: tasks } = useSubjects({
    perspective,
    source: channel.id,
    subject: "Task",
  });

  const { profile } = useAgent({
    client: agent,
    did: item?.author,
    //@ts-ignore
    formatter: profileFormatter,
  });

  // aggregate all items into array and sort by date
  useEffect(() => {
    const newItems = [
      ...messages.map((message) =>
        transformItem(channel.id, "Message", message)
      ),
      ...posts.map((post) => transformItem(channel.id, "Post", post)),
      ...tasks.map((task) => transformItem(channel.id, "Task", task)),
    ].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    // compare previous and new items before updating state to prevent infinite render loop
    setItems((prevItems) => {
      if (!isEqual(prevItems, newItems)) return newItems;
      return prevItems;
    });
  }, [messages, posts, tasks]);

  useEffect(() => {
    if (items.length) setItem(items.find((i) => i.id === itemId));
  }, [items]);

  return (
    <div className={styles.wrapper}>
      <j-flex gap="300" a="center">
        <p>
          <b>{match.channel.name}</b>
        </p>
        <p>|</p>
        {similarity ? (
          <p>Similarity: {similarity}</p>
        ) : (
          <p>Relevance: {relevance}</p>
        )}
      </j-flex>
      <j-flex gap="300" a="center">
        <j-icon name={item?.icon} color="ui-400" />
        <Avatar size="xs" did={item?.author} profile={profile} />
      </j-flex>
      <j-text
        nomargin
        dangerouslySetInnerHTML={{ __html: item?.text }}
        className={styles.text}
        color="color-white"
      />
    </div>
  );
}
