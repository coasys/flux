import { useEffect, useState } from "preact/hooks";
import { ChevronDownSVG, ChevronRightSVG, ChevronUpSVG, CurveSVG } from "../../utils";
import Avatar from "../Avatar";
import PercentageRing from "../PercentageRing";
import styles from "./TimelineBlock.module.scss";
import { Literal } from "@coasys/ad4m";
import { getSynergyItems } from "@coasys/flux-utils";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import {
  SynergyGroup,
  SynergyItem,
  SynergyMatch,
  SynergyTopic,
  BlockType,
  SearchType,
  MatchIndexes,
  GroupingOption,
} from "@coasys/flux-utils";

type Props = {
  agent: AgentClient;
  perspective: any;
  blockType: BlockType;
  data: any;
  timelineIndex: number;
  selectedTopicId: string;
  match?: SynergyMatch;
  matchIndexes?: MatchIndexes;
  setMatchIndexes?: (indexes: MatchIndexes) => void;
  zoom?: GroupingOption;
  refreshTrigger?: number;
  selectedItemId?: string;
  setSelectedItemId?: (id: string) => void;
  search?: (type: SearchType, itemId: string, topic?: SynergyTopic) => void;
  setLoading?: (loading: boolean) => void;
  loading?: boolean;
};

export default function TimelineBlock({
  agent,
  perspective,
  data,
  blockType,
  timelineIndex,
  zoom,
  refreshTrigger,
  match,
  matchIndexes,
  setMatchIndexes,
  selectedTopicId,
  selectedItemId,
  setSelectedItemId,
  search,
  setLoading,
  loading,
}: Props) {
  const { baseExpression, name, summary, timestamp, start, end, author, index, parentIndex } = data;
  const [totalChildren, setTotalChildren] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);
  const [topics, setTopics] = useState<SynergyTopic[]>([]);
  const [children, setChildren] = useState<SynergyGroup[] | SynergyItem[]>([]);
  const [showChildren, setShowChildren] = useState(false);
  const [selected, setSelected] = useState(false);
  const [collapseBefore, setCollapseBefore] = useState(true);
  const [collapseAfter, setCollapseAfter] = useState(true);
  const matchIndex = match ? (blockType === "conversation" ? matchIndexes.subgroup : matchIndexes.item) : null;
  const onMatchTree = match
    ? (blockType === "conversation" && index === matchIndexes.conversation) ||
      (blockType === "subgroup" && parentIndex === matchIndexes.conversation && index === matchIndexes.subgroup)
    : false;

  async function getConversationStats() {
    // find the total subgroup count and participants in the conversation
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
      const [totalSubgroups, conversationParticipants] = stats;
      setTotalChildren(totalSubgroups);
      setParticipants(conversationParticipants);
    }
  }

  async function getSubgroupStats() {
    // find the total item count and participants in the subgroup
    const result = await perspective.infer(`
      findall([ItemCount, SortedAuthors], (
        % 1. Gather all items in the subgroup
        findall(Item, (
          triple("${baseExpression}", "ad4m://has_child", Item),
          % Ensure item is not a SemanticRelationship
          (
            subject_class("Message", MC),
            instance(MC, Item)
            ;
            subject_class("Post", PC),
            instance(PC, Item)
            ;
            subject_class("Task", TC),
            instance(TC, Item)
          )
        ), AllItems),

        % 2. Deduplicate items
        sort(AllItems, UniqueItems),
        length(UniqueItems, ItemCount),

        % 3. For each item, gather its authors
        findall(Author, (
          member(I, UniqueItems),
          link(_, "ad4m://has_child", I, _, Author)
        ), AuthorList),

        % 4. Remove duplicates among authors
        sort(AuthorList, SortedAuthors)
      ), [Stats]).
    `);

    const stats = result[0]?.Stats;
    if (stats) {
      const [totalItems, subgroupParticipants] = stats;
      setTotalChildren(totalItems);
      setParticipants(subgroupParticipants);
    }
  }

  async function getConversationTopics() {
    // find the conversations topics
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

    const topics: SynergyTopic[] =
      result[0]?.Topics?.map(
        ([baseExpression, name]): SynergyTopic => ({
          baseExpression,
          name: Literal.fromUrl(name).get().data,
        })
      ) || [];

    setTopics(topics);
  }

  // todo: check why deduplication is needed for subgroup topics
  async function getSubgroupTopics() {
    // find the subgroups topics
    const result = await perspective.infer(`
      % Collect and deduplicate topic data for this specific subgroup
      findall(TopicList, (
        findall([TopicBase, TopicName], (
          % 1. Find semantic relationships where 'flux://has_expression' = this subgroup's baseExpression
          subject_class("SemanticRelationship", SR),
          instance(SR, Relationship),
          triple(Relationship, "flux://has_expression", "${baseExpression}"),
          
          % 2. Retrieve the Topic base
          triple(Relationship, "flux://has_tag", TopicBase),
          
          % 3. Get the topic class & name
          subject_class("Topic", T),
          instance(T, TopicBase),
          property_getter(T, TopicBase, "topic", TopicName)
        ), UnsortedTopics),
  
        % 4. Deduplicate via sort
        sort(UnsortedTopics, TopicList)
      ), [Topics]).
    `);

    const topics: SynergyTopic[] =
      result[0]?.Topics?.map(
        ([baseExpression, name]): SynergyTopic => ({
          baseExpression,
          name: Literal.fromUrl(name).get().data,
        })
      ) || [];

    setTopics(topics);
  }

  async function getSubgroups() {
    // find all subgroups in the conversation (include timestamps for the first and last item in each subgroup)
    const result = await perspective.infer(`
      findall(SubgroupInfo, (
        % 1. Identify all subgroups in the conversation
        subject_class("ConversationSubgroup", CS),
        instance(CS, Subgroup),
        triple("${baseExpression}", "ad4m://has_child", Subgroup),
    
        % 2. Retrieve subgroup properties
        property_getter(CS, Subgroup, "subgroupName", SubgroupName),
        property_getter(CS, Subgroup, "summary", Summary),
    
        % 3. Collect timestamps for valid items only
        findall(Timestamp, (
          triple(Subgroup, "ad4m://has_child", Item),
          
          % Check item is valid type
          (
            subject_class("Message", MC),
            instance(MC, Item)
            ;
            subject_class("Post", PC),
            instance(PC, Item)
            ;
            subject_class("Task", TC),
            instance(TC, Item)
          ),
          
          % Get items timestamp from link to channel
          link(ChannelId, "ad4m://has_child", Item, Timestamp, _),
          subject_class("Channel", CH),
          instance(CH, ChannelId)
        ), Timestamps),
    
        % 4. Derive start and end from earliest & latest timestamps
        (
          Timestamps = []
          -> StartTime = 0, EndTime = 0
          ; sort(Timestamps, Sorted),
            Sorted = [StartTime|_],
            reverse(Sorted, [EndTime|_])
        ),
    
        % 5. Build a single structure for each subgroup
        SubgroupInfo = [Subgroup, SubgroupName, Summary, StartTime, EndTime]
      ), Subgroups).
    `);

    // convert raw prolog output into a friendlier JS array
    const newSubgroups = (result[0]?.Subgroups || []).map(([baseExpression, subgroupName, summary, start, end]) => ({
      baseExpression,
      name: Literal.fromUrl(subgroupName).get().data,
      summary: Literal.fromUrl(summary).get().data,
      start: parseInt(start, 10),
      end: parseInt(end, 10),
    }));

    if (match) {
      newSubgroups.forEach((subgroup, subgroupIndex) => {
        if (subgroup.baseExpression === match.baseExpression) {
          setMatchIndexes({ conversation: index, subgroup: subgroupIndex, item: undefined });
          setLoading(false);
        }
      });
    }

    setChildren(newSubgroups);
  }

  async function getItems() {
    const newItems = await getSynergyItems(perspective, baseExpression);
    newItems.forEach((item: any, itemIndex) => {
      item.blockType = "item";
      if (match && item.baseExpression === match.baseExpression) {
        setMatchIndexes({ conversation: parentIndex, subgroup: index, item: itemIndex });
        setLoading(false);
      }
    });
    setChildren(newItems);
  }

  function onGroupClick() {
    if (!match) setSelectedItemId(selected ? null : baseExpression);
    if (!selected) {
      if (blockType === "conversation") getConversationTopics();
      if (blockType === "subgroup") getSubgroupTopics();
    }
  }

  // get stats on first load
  useEffect(() => {
    if (blockType === "conversation") getConversationStats();
    if (blockType === "subgroup") getSubgroupStats();
  }, [refreshTrigger]);

  // get data when expanding children
  useEffect(() => {
    // false on first load. updated when zoom useEffect below fires and later when children are expanded by user
    if (showChildren) {
      if (blockType === "conversation") getSubgroups();
      if (blockType === "subgroup") getItems();
      // deselects block when clicked on if not a match and not the currently selected item
      if (!match && selectedItemId !== baseExpression) setSelectedItemId(null);
    }
  }, [showChildren, refreshTrigger]);

  // expand or collapse children based on zoom level
  useEffect(() => {
    // if a match and loading has finished at the level above, stop further expansion
    if (!match || loading) {
      if (zoom === "Conversations") setShowChildren(false);
      else if (zoom === "Subgroups") setShowChildren(blockType === "conversation");
      else setShowChildren(true);
    }
  }, [zoom]);

  // mark as selected & get topics if match
  useEffect(() => {
    const isSelected = selectedItemId === baseExpression;
    const isMatch = match?.baseExpression === baseExpression;
    setSelected(isSelected || isMatch);
    if (isMatch) {
      if (blockType === "conversation") getConversationTopics();
      if (blockType === "subgroup") getSubgroupTopics();
    }
  }, [selectedItemId]);

  // scroll to matching item
  useEffect(() => {
    if (selectedItemId) {
      const item = document.getElementById(`timeline-block-${selectedItemId}`);
      const timeline = document.getElementById(`timeline-${timelineIndex}`);
      timeline.scrollBy({
        top: item?.getBoundingClientRect().top - 550,
        behavior: "smooth",
      });
    }
  }, [selectedItemId]);

  return (
    <div id={`timeline-block-${baseExpression}`} className={`${styles.block} ${styles[blockType]}`}>
      {!match && <button className={styles.groupButton} onClick={onGroupClick} />}
      {blockType === "conversation" && <j-timestamp value={timestamp} relative className={styles.timestamp} />}
      {blockType === "subgroup" && (
        <span className={styles.timestamp}>
          {((new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60).toFixed(1)} mins
        </span>
      )}
      {blockType === "item" && <j-timestamp value={timestamp} timeStyle="short" className={styles.timestamp} />}
      <div className={styles.position}>
        {!showChildren && <div className={`${styles.node} ${selected && styles.selected}`} />}
        <div className={styles.line} />
      </div>
      {["conversation", "subgroup"].includes(blockType) && (
        <j-flex direction="column" gap="300" className={styles.content}>
          <j-flex direction="column" gap="300" className={`${styles.card} ${selected && styles.selected}`}>
            <j-flex a="center" gap="400">
              <j-flex a="center" gap="400">
                {match && match.baseExpression === baseExpression && (
                  <PercentageRing ringSize={70} fontSize={10} score={match.score * 100} />
                )}
                <h1>{name}</h1>
              </j-flex>
              {totalChildren > 0 && (
                <button className={styles.showChildrenButton} onClick={() => setShowChildren(!showChildren)}>
                  {showChildren ? <ChevronDownSVG /> : <ChevronRightSVG />}
                  {totalChildren}
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
                    onClick={() => search("topic", baseExpression, topic)}
                    disabled={!!match}
                    style={{ cursor: !!match ? "default" : "pointer" }}
                  >
                    #{topic.name}
                  </button>
                ))}
                {!match && (
                  <button className={`${styles.tag} ${styles.vector}`} onClick={() => search("vector", baseExpression)}>
                    <j-icon name="flower2" color="color-success-500" size="sm" style={{ marginRight: 5 }} />
                    Synergize
                  </button>
                )}
              </j-flex>
            )}
          </j-flex>
          {totalChildren > 0 && showChildren && (
            <div className={styles.children}>
              {onMatchTree && collapseBefore && matchIndex > 0 && (
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
              {children
                .filter((child: any, i) => {
                  child.parentIndex = index;
                  child.index = i;
                  if (onMatchTree) {
                    // skip if below match
                    if (zoom === "Conversations") return true;
                    if (zoom === "Subgroups" && blockType === "subgroup") return true;
                    // skip if collapsed
                    if (collapseBefore && collapseAfter) return i === matchIndex;
                    else if (collapseBefore) return i >= matchIndex;
                    else if (collapseAfter) return i <= matchIndex;
                  }
                  return true;
                })
                .map((child) => (
                  <TimelineBlock
                    key={child.baseExpression}
                    agent={agent}
                    perspective={perspective}
                    blockType={blockType === "conversation" ? "subgroup" : "item"}
                    data={child}
                    timelineIndex={timelineIndex}
                    match={match}
                    matchIndexes={matchIndexes}
                    setMatchIndexes={setMatchIndexes}
                    zoom={zoom}
                    refreshTrigger={refreshTrigger}
                    selectedTopicId={selectedTopicId}
                    selectedItemId={selectedItemId}
                    setSelectedItemId={setSelectedItemId}
                    search={search}
                    setLoading={setLoading}
                    loading={loading}
                  />
                ))}
              <div className={styles.curveBottom}>
                <CurveSVG />
              </div>
              {onMatchTree && collapseAfter && matchIndex < children.length - 1 && (
                <div className={styles.expandButtonWrapper} style={{ marginTop: blockType === "subgroup" ? -8 : -20 }}>
                  <div className={styles.expandButton}>
                    <j-button onClick={() => setCollapseAfter(false)}>
                      See more
                      <span>
                        <ChevronDownSVG /> {children.length - matchIndex - 1}
                      </span>
                    </j-button>
                  </div>
                </div>
              )}
            </div>
          )}
        </j-flex>
      )}
      {blockType === "item" && (
        <j-flex gap="400" a="center" className={`${styles.itemCard} ${selected && styles.selected}`}>
          {match && match.baseExpression === baseExpression && (
            <PercentageRing ringSize={70} fontSize={10} score={match.score * 100} />
          )}
          <j-flex gap="300" direction="column">
            <j-flex gap="400" a="center">
              <j-icon name={data.icon} color="ui-400" size="lg" />
              <j-flex gap="400" a="center" wrap>
                <Avatar did={author} showName />
              </j-flex>
            </j-flex>
            <j-text
              nomargin
              dangerouslySetInnerHTML={{ __html: data.text }}
              className={styles.itemText}
              color="color-white"
            />
            {selected && (
              <j-flex gap="300" wrap style={{ marginTop: 10 }}>
                {/* {topics.map((topic) => (
                  <button
                    className={`${styles.tag} ${selected && selectedTopicId === topic.baseExpression && styles.focus}`}
                    onClick={() => search("topic", topic)}
                    disabled={!!match}
                    style={{ cursor: !!match ? "default" : "pointer" }}
                  >
                    #{topic.name}
                  </button>
                ))} */}
                {!match && (
                  <button className={`${styles.tag} ${styles.vector}`} onClick={() => search("vector", baseExpression)}>
                    <j-icon name="flower2" color="color-success-500" size="sm" style={{ marginRight: 5 }} />
                    Synergize
                  </button>
                )}
              </j-flex>
            )}
          </j-flex>
        </j-flex>
      )}
    </div>
  );
}
