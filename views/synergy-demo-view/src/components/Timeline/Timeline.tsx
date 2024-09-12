import { useSubjects } from "@coasys/ad4m-react-hooks";
import {
  Conversation,
  ConversationSubgroup,
  Message,
  Post,
  SubjectRepository,
} from "@coasys/flux-api";
import { findRelationships, findTopics, getSubgroupItems } from "@coasys/flux-utils";
import { isEqual } from "lodash";
import { useEffect, useState } from "preact/hooks";
import TimelineBlock from "../TimelineBlock";
import styles from "./Timeline.module.scss";

type Props = {
  agent: any;
  perspective: any;
  index?: number;
  channelId: string;
  selectedTopic?: any;
  search: (type: "topic" | "vector", id: string) => void;
};

const zoomOptions = ["Conversations", "Subgroups", "Items"];

export default function Timeline({
  agent,
  perspective,
  index,
  channelId,
  selectedTopic,
  search,
}: Props) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<any>(null);
  const [zoom, setZoom] = useState("Conversations");

  const { entries: messages } = useSubjects({
    perspective,
    source: channelId,
    subject: Message,
  });
  const { entries: posts } = useSubjects({
    perspective,
    source: channelId,
    subject: Post,
  });
  const { entries: tasks } = useSubjects({
    perspective,
    source: channelId,
    subject: "Task",
  });

  async function getConvoData() {
    const conversationRepo = await new SubjectRepository(Conversation, {
      perspective,
      source: channelId,
    });
    const conversations = (await conversationRepo.getAllData()) as any;
    const conversationsWithData = await Promise.all(
      conversations.map(async (conversation) => {
        const subgroupRepo = await new SubjectRepository(ConversationSubgroup, {
          perspective,
          source: conversation.id,
        });
        const subgroups = (await subgroupRepo.getAllData()) as any;
        const subgroupsWithData = await Promise.all(
          subgroups.map(async (subgroup) => {
            const subgroupRelationships = await findRelationships(perspective, subgroup.id);
            subgroup.type = "subgroup";
            subgroup.topics = await findTopics(perspective, subgroupRelationships);
            const subgroupItems = await getSubgroupItems(perspective, subgroup.id);
            subgroup.start = subgroupItems[0].timestamp;
            subgroup.end = subgroupItems[subgroupItems.length - 1].timestamp;
            let subgroupParticipants = [];
            subgroup.children = await Promise.all(
              subgroupItems.map(async (item: any) => {
                if (!subgroupParticipants.find((p) => p === item.author))
                  subgroupParticipants.push(item.author);
                const itemRelationships = await findRelationships(perspective, item.id);
                item.topics = await findTopics(perspective, itemRelationships);
                return item;
              })
            );
            subgroup.participants = subgroupParticipants;
            return subgroup;
          })
        );
        conversation.type = "conversation";
        conversation.participants = [];
        subgroupsWithData.forEach((subgroup) => {
          subgroup.participants.forEach((p) => {
            if (!conversation.participants.includes(p)) conversation.participants.push(p);
          });
        });
        const conversationRelationships = await findRelationships(perspective, conversation.id);
        conversation.topics = await findTopics(perspective, conversationRelationships);
        conversation.children = subgroupsWithData;
        return conversation;
      })
    );
    setConversations((prevItems) => {
      if (!isEqual(prevItems, conversationsWithData)) return conversationsWithData;
      return prevItems;
    });
  }

  useEffect(() => {
    if (channelId) getConvoData();
  }, [channelId, JSON.stringify(messages), JSON.stringify(posts), JSON.stringify(tasks)]);

  // // scroll to matching item
  // useEffect(() => {
  //   if (selectedItemId && conversations.length) {
  //     const item = document.getElementById(`${index}-${selectedItemId}`);
  //     const timelineItems = document.getElementById(`timeline-items-${index}`);
  //     timelineItems.scrollBy({
  //       top: item?.getBoundingClientRect().top - 420,
  //       behavior: "smooth",
  //     });
  //   }
  // }, [conversations, selectedItemId]);

  return (
    <div id={`timeline-${index}`} className={`${styles.wrapper} ${index > 0 && styles.match}`}>
      <j-flex a="center" gap="400" wrap>
        <j-text nomargin style={{ flexShrink: 0 }}>
          Zoom
        </j-text>
        <j-menu>
          <j-menu-group collapsible title={zoom}>
            {zoomOptions.map((option) => (
              <j-menu-item selected={zoom === option} onClick={() => setZoom(option)}>
                {option}
              </j-menu-item>
            ))}
          </j-menu-group>
        </j-menu>
      </j-flex>
      <div className={styles.content}>
        <div className={styles.fades}>
          <div className={styles.fadeTop} />
          <div className={styles.fadeBottom} />
          <div className={styles.line} />
        </div>
        <div id={`timeline-items-${index}`} className={styles.items}>
          <div style={{ minHeight: "100%", margin: "130px 0" }}>
            {conversations.map((conversation: any) => (
              <TimelineBlock
                agent={agent}
                perspective={perspective}
                data={conversation}
                zoom={zoom}
                selectedTopicId={selectedTopic.id}
                selectedItemId={selectedItemId}
                setSelectedItemId={setSelectedItemId}
                search={search}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
