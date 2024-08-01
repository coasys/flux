import { useState } from "preact/hooks";
import TimelineItem from "../TimelineItem";
import styles from "./Timeline.module.scss";

type Props = {
  agent: any;
  perspective: any;
  source: string;
  items: any[];
};

export default function Timeline({ agent, perspective, source, items }: Props) {
  const [selectedNodeId, setSelectedNodeId] = useState<any>(null);

  return (
    <div className={styles.wrapper}>
      {items.map((item) => (
        <TimelineItem
          agent={agent}
          perspective={perspective}
          source={source}
          item={item}
          selected={item.id === selectedNodeId}
          setSelected={() => setSelectedNodeId(item.id)}
        />
      ))}
    </div>
  );
}
