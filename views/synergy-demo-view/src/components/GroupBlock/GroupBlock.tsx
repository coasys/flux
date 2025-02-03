import { useEffect, useState } from "preact/hooks";
import { ChevronDownSVG, ChevronRightSVG, ChevronUpSVG, CurveSVG } from "../../utils";
import Avatar from "../Avatar";
import PercentageRing from "../PercentageRing";
import styles from "./GroupBlock.module.scss";
import { Literal } from "@coasys/ad4m";

type Props = {
  agent: any;
  perspective: any;
  type: "conversation" | "subgroup";
  data: any;
  index: number;
  selectedTopicId: string;
  match?: any;
  zoom?: string;
  selectedItemId?: string;
  setSelectedItemId?: (id: string) => void;
  search?: (type: "topic" | "vector", id: string) => void;
};

export default function GroupBlock({
  agent,
  perspective,
  data,
  type,
  index,
  zoom,
  match,
  selectedTopicId,
  selectedItemId,
  setSelectedItemId,
  search,
}: Props) {
  const { baseExpression, conversationName, summary, timestamp, matchIndex } = data;
  const [totalSubgroups, setTotalSubgroups] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [showChildren, setShowChildren] = useState(data.matchIndex !== undefined);
  const [selected, setSelected] = useState(false);
  const [collapseBefore, setCollapseBefore] = useState(true);
  const [collapseAfter, setCollapseAfter] = useState(true);

  // todo: adapt component to work with subgroups as well...

  // todo: getStats()
  async function getConversationStats() {
    // query prolog to find the totalSubgroups count and participant dids for the conversation
    const result = await perspective.infer(`
      findall([SubgroupCount, SortedAuthors], (
        % 1. Gather all subgroups and count
        findall(Subgroup, (
          subject_class("ConversationSubgroup", CS),
          instance(CS, Subgroup),
          triple("${baseExpression}", "ad4m://has_child", Subgroup)
        ), SubgroupList),
        length(SubgroupList, SubgroupCount),
  
        % 2. Gather and deduplicate authors
        findall(Author, (
          member(S, SubgroupList),
          triple(S, "ad4m://has_child", Item),
          link(_, "ad4m://has_child", Item, _, Author)
        ), AuthorList),
        sort(AuthorList, SortedAuthors)
      ), [Stats]).
    `);

    const stats = result[0]?.Stats;
    if (stats) {
      const [totalSubgroups, allParticipants] = stats;
      setTotalSubgroups(totalSubgroups);
      setParticipants(allParticipants);
    }
  }

  async function getTopics() {
    // query prolog to find the conversations topics
    const result = await perspective.infer(`
      % Get all topics and sort in one step
      findall(TopicList, (
        % First get all topic pairs
        findall([TopicBase, TopicName], (
          % 1. Gather subgroups
          findall(Subgroup, (
            subject_class("ConversationSubgroup", CS),
            instance(CS, Subgroup),
            triple("${baseExpression}", "ad4m://has_child", Subgroup)
          ), SubgroupList),
  
          % 2. Get topics from relationships
          member(S, SubgroupList),
          subject_class("SemanticRelationship", SR),
          instance(SR, Relationship),
          triple(Relationship, "flux://has_expression", S),
          triple(Relationship, "flux://has_tag", TopicBase),
          
          % 3. Get topic names
          subject_class("Topic", T),
          instance(T, TopicBase),
          property_getter(T, TopicBase, "topic", TopicName)
        ), AllTopics),
        
        % Remove duplicates
        sort(AllTopics, TopicList)
      ), [Topics]).
    `);

    const topics =
      result[0]?.Topics?.map(([baseExpression, name]) => ({
        baseExpression,
        name: Literal.fromUrl(name).get().data,
      })) || [];

    setTopics(topics);
  }

  async function getSubgroups() {}

  function onConversationClick() {
    setSelectedItemId(selected ? null : baseExpression);
    if (!selected) getTopics();
  }

  useEffect(() => {
    getConversationStats();
    if (showChildren) getSubgroups();
  }, []);

  // mark as selected
  useEffect(() => {
    setSelected(selectedItemId === baseExpression || (match && match.baseExpression === baseExpression));
  }, [selectedItemId]);

  // expand or collapse children based on zoom level
  useEffect(() => {
    setShowChildren(zoom !== "Conversations");
  }, [zoom]);

  // scroll to matching item
  useEffect(() => {
    if (selectedItemId) {
      const item = document.getElementById(`timeline-block-${selectedItemId}`);
      const timeline = document.getElementById(`timeline-${index}`);
      timeline.scrollBy({
        top: item?.getBoundingClientRect().top - 550,
        behavior: "smooth",
      });
    }
  }, [selectedItemId]);

  return (
    <div id={`timeline-block-${baseExpression}`} className={`${styles.block} ${styles.conversation}`}>
      {!match && <button className={styles.groupButton} onClick={onConversationClick} />}
      <j-timestamp value={timestamp} relative className={styles.timestamp} />
      <div className={styles.position}>
        {!showChildren && <div className={`${styles.node} ${selected && styles.selected}`} />}
        <div className={styles.line} />
      </div>
      <j-flex direction="column" gap="300" className={styles.content}>
        <j-flex direction="column" gap="300" className={`${styles.card} ${selected && styles.selected}`}>
          <j-flex a="center" gap="400">
            <j-flex a="center" gap="400">
              {match && match.baseExpression === baseExpression && (
                <PercentageRing ringSize={70} fontSize={10} score={match.score * 100} />
              )}
              <h1>{data[`${type}Name`]}</h1>
            </j-flex>
            {totalSubgroups > 0 && (
              <button
                className={styles.showChildrenButton}
                onClick={() => {
                  if (!match && selectedItemId !== baseExpression) setSelectedItemId(null);
                  setShowChildren(!showChildren);
                }}
              >
                {showChildren ? <ChevronDownSVG /> : <ChevronRightSVG />}
                {totalSubgroups}
              </button>
            )}
          </j-flex>
          <p className={styles.summary}>{summary}</p>
          <j-flex className={styles.participants}>
            {participants.map((p, i) => (
              <Avatar did={p} style={{ marginLeft: i > 0 ? -10 : 0 }} />
            ))}
          </j-flex>
          {selected && (
            <j-flex gap="300" wrap style={{ marginTop: 5 }}>
              {topics.map((topic) => (
                <button
                  className={`${styles.tag} ${selectedTopicId === topic.baseExpression && styles.focus}`}
                  onClick={() => search("topic", topic)}
                  disabled={!!match}
                  style={{ cursor: !!match ? "default" : "pointer" }}
                >
                  #{topic.name}
                </button>
              ))}
              {!match && (
                <button className={`${styles.tag} ${styles.vector}`} onClick={() => search("vector", data)}>
                  <j-icon name="flower2" color="color-success-500" size="sm" style={{ marginRight: 5 }} />
                  Synergize
                </button>
              )}
            </j-flex>
          )}
        </j-flex>
        {totalSubgroups > 0 && showChildren && (
          <div className={styles.children}>
            {matchIndex > 0 && collapseBefore && (
              <>
                <div className={styles.expandButtonWrapper} style={{ marginTop: 6 }}>
                  <div className={styles.expandButton}>
                    <j-button onClick={() => setCollapseBefore(false)}>
                      See more
                      <span>
                        <ChevronUpSVG /> {matchIndex}
                      </span>
                    </j-button>
                  </div>
                </div>
                <div className={styles.expandButtonPadding} />
              </>
            )}
            <div className={styles.curveTop}>
              <CurveSVG />
            </div>
            {subgroups
              .filter((child: any, i) => {
                if (match && matchIndex !== undefined) {
                  if (collapseBefore && collapseAfter) return i === matchIndex;
                  else if (collapseBefore) return i >= matchIndex;
                  else if (collapseAfter) return i <= matchIndex;
                }
                return child;
              })
              .map((subgroup) => (
                <j-text>{subgroup.subgroupName}</j-text>
                // <TimelineBlock
                //   key={child.baseExpression}
                //   agent={agent}
                //   perspective={perspective}
                //   data={child}
                //   index={index}
                //   match={match}
                //   zoom={zoom}
                //   selectedTopicId={selectedTopicId}
                //   selectedItemId={selectedItemId}
                //   setSelectedItemId={setSelectedItemId}
                //   search={search}
                // />
              ))}
            <div className={styles.curveBottom}>
              <CurveSVG />
            </div>
            {matchIndex < subgroups.length - 1 && collapseAfter && (
              <div className={styles.expandButtonWrapper} style={{ marginTop: -20 }}>
                <div className={styles.expandButton}>
                  <j-button onClick={() => setCollapseAfter(false)}>
                    See more
                    <span>
                      <ChevronDownSVG /> {subgroups.length - matchIndex - 1}
                    </span>
                  </j-button>
                </div>
              </div>
            )}
          </div>
        )}
      </j-flex>
    </div>
  );
}
