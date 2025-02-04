import { useEffect, useState } from "preact/hooks";
import { ChevronDownSVG, ChevronUpSVG, getConversations } from "../../utils";
import TimelineBlock from "../TimelineBlock";
import styles from "./Match.module.scss";

type Props = {
  perspective: any;
  agent: any;
  match: any;
  index: number;
  grouping: string;
  selectedTopicId: string;
};

export default function Match({ perspective, agent, match, index, grouping, selectedTopicId }: Props) {
  const { channel } = match;
  const [matchLoading, setMatchLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [matchIndexes, setMatchIndexes] = useState({ conversation: undefined, subgroup: undefined, item: undefined });
  const [collapseBefore, setCollapseBefore] = useState(true);
  const [collapseAfter, setCollapseAfter] = useState(true);

  async function getData() {
    const newConversations = await getConversations(perspective, channel.id);
    newConversations.forEach((conversation, conversationIndex) => {
      if (conversation.baseExpression === match.baseExpression) {
        setMatchIndexes((prev) => ({ ...prev, conversation: conversationIndex }));
        setMatchLoading(false);
      }
    });
    setConversations(newConversations);
  }

  useEffect(() => {
    getData();
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.fades}>
        <div className={styles.fadeTop} />
        <div className={styles.fadeBottom} />
        <div className={styles.line} />
      </div>
      <h2 className={styles.channelName}>{channel.name}</h2>
      {matchLoading && (
        <div style={{ marginLeft: 130, marginBottom: -14 }}>
          <j-flex gap="500" a="center">
            <j-text nomargin>Loading match...</j-text>
            <j-spinner size="xs" />
          </j-flex>
        </div>
      )}
      {conversations.length > 0 && (
        <div id={`timeline-${index + 1}`} className={`${styles.items} ${matchLoading && styles.hidden}`}>
          {matchIndexes.conversation !== undefined && matchIndexes.conversation > 0 && collapseBefore && (
            <div className={styles.expandButtonWrapper} style={{ marginBottom: 20 }}>
              <div className={styles.expandButton}>
                <j-button onClick={() => setCollapseBefore(false)}>
                  See more
                  <span>
                    <ChevronUpSVG /> {matchIndexes.conversation}
                  </span>
                </j-button>
              </div>
            </div>
          )}
          {conversations
            .filter((conversation: any, i: number) => {
              conversation.index = i;
              if (matchIndexes.conversation !== undefined) {
                if (collapseBefore && collapseAfter) return i === matchIndexes.conversation;
                else if (collapseBefore) return i >= matchIndexes.conversation;
                else if (collapseAfter) return i <= matchIndexes.conversation;
              }
              return true;
            })
            .map((conversation: any) => (
              <TimelineBlock
                key={conversation.baseExpression}
                agent={agent}
                perspective={perspective}
                blockType="conversation"
                data={conversation}
                timelineIndex={index + 1}
                zoom={grouping}
                match={match}
                matchIndexes={matchIndexes}
                setMatchIndexes={setMatchIndexes}
                selectedTopicId={selectedTopicId}
                matchLoading={matchLoading}
                setMatchLoading={setMatchLoading}
              />
            ))}
          {matchIndexes.conversation !== undefined &&
            matchIndexes.conversation < conversations.length - 1 &&
            collapseAfter && (
              <div className={styles.expandButtonWrapper} style={{ marginTop: -20 }}>
                <div className={styles.expandButton}>
                  <j-button onClick={() => setCollapseAfter(false)}>
                    See more
                    <span>
                      <ChevronDownSVG /> {conversations.length - matchIndexes.conversation - 1}
                    </span>
                  </j-button>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
