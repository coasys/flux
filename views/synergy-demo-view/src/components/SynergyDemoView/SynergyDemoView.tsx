import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Channel, SubjectRepository } from "@coasys/flux-api";
import { findRelationships, findTopics } from "@coasys/flux-utils";
import { useEffect, useState } from "preact/hooks";
import Timeline from "../Timeline";
import styles from "./SynergyDemoView.module.scss";

type Props = {
  perspective: any;
  source: string;
  agent: AgentClient;
};

export default function SynergyDemoView({ perspective, agent, source }: Props) {
  const [openAIKey, setOpenAIKey] = useState(
    localStorage?.getItem("openAIKey") || ""
  );
  const [matches, setMatches] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [topic, setTopic] = useState("");

  async function findMatches(
    channel: any,
    subjectClass: string,
    topic: string
  ): Promise<any[]> {
    // searches for items of the subject class with matching topics in the channel
    return await new Promise(async (resolveMatches: any) => {
      const newMatches = [];
      const items = await new SubjectRepository(subjectClass, {
        perspective,
        source: channel.id,
      }).getAllData();
      Promise.all(
        items.map(
          (item: any) =>
            new Promise(async (resolve: any) => {
              const relationships = await findRelationships(
                perspective,
                item.id
              );
              const topics = await findTopics(perspective, relationships);
              topics.forEach((t: any) => {
                if (topic === t) newMatches.push({ channel, itemId: item.id });
              });
              resolve();
            })
        )
      )
        .then(() => resolveMatches(newMatches))
        .catch((error) => {
          console.log(error);
          resolveMatches([]);
        });
    });
  }

  async function synergize(item, topic) {
    // searches other channels in the neighbourhood to find items with matching topic tags
    setMatches([]);
    setTopic(topic);
    const channels = await new SubjectRepository(Channel, {
      perspective,
    }).getAllData();
    let newMatches = [];
    Promise.all(
      channels
        .filter((channel: any) => channel.id !== item.channelId)
        .map(
          (channel: any) =>
            new Promise(async (resolve: any) => {
              const messageMatches = await findMatches(
                channel,
                "Message",
                topic
              );
              const postMatches = await findMatches(channel, "Post", topic);
              const taskMatches = await findMatches(channel, "Task", topic);
              newMatches.push(
                ...messageMatches,
                ...postMatches,
                ...taskMatches
              );
              resolve();
            })
        )
    ).then(() => {
      setMatches(newMatches);
    });
  }

  function scrollToTimeline(index) {
    const timeline = document.getElementById(`timeline-${index}`);
    timeline.scrollIntoView({ behavior: "smooth" });
  }

  function getAllTopics() {
    // gather up all existing topics in the neighbourhood
    perspective
      .getAllSubjectInstances("Topic")
      .then(async (topics) => {
        setAllTopics(
          await Promise.all(
            topics.map(async (t) => {
              return { id: t.baseExpression, name: await t.topic };
            })
          )
        );
      })
      .catch(console.log);
  }

  // reset matches when channel changes
  useEffect(() => {
    setMatches([]);
  }, [source]);

  useEffect(() => getAllTopics(), []);

  return (
    <div className={styles.container}>
      <j-text uppercase size="500" weight="800" color="primary-500">
        Synergy Demo
      </j-text>
      <j-box mb="400">
        <j-input
          label="OpenAI Key"
          value={openAIKey}
          placeholder="Required to process content..."
          onInput={(event) => {
            const value = (event.target as HTMLInputElement).value;
            setOpenAIKey(value);
            localStorage?.setItem("openAIKey", value);
          }}
        />
      </j-box>
      <j-flex gap="400">
        All topics:
        {allTopics.map((t) => (
          <j-text>#{t.name}</j-text>
        ))}
      </j-flex>
      {window.innerWidth > 1200 ? (
        <j-flex className={styles.wrapper}>
          <div style={{ flexBasis: "50%", flexShrink: 0 }}>
            <Timeline
              agent={agent}
              perspective={perspective}
              channel={source}
              selectedTopic={topic}
              synergize={synergize}
              scrollToTimeline={scrollToTimeline}
              index={0}
              totalMatches={matches.length}
              allTopics={allTopics}
              getAllTopics={getAllTopics}
            />
          </div>
          <j-flex gap="500" className={styles.timelines}>
            {matches.map((match, index) => (
              <Timeline
                agent={agent}
                perspective={perspective}
                channel={match.channel}
                selectedTopic={topic}
                synergize={synergize}
                scrollToTimeline={scrollToTimeline}
                itemId={match.itemId}
                index={index + 1}
                totalMatches={matches.length}
                allTopics={allTopics}
                getAllTopics={getAllTopics}
              />
            ))}
          </j-flex>
        </j-flex>
      ) : (
        <j-flex gap="500" className={styles.timelines}>
          <Timeline
            agent={agent}
            perspective={perspective}
            channel={source}
            selectedTopic={topic}
            synergize={synergize}
            scrollToTimeline={scrollToTimeline}
            index={0}
            totalMatches={matches.length}
            allTopics={allTopics}
            getAllTopics={getAllTopics}
          />
          {matches.map((match, index) => (
            <Timeline
              agent={agent}
              perspective={perspective}
              channel={match.channel}
              selectedTopic={topic}
              synergize={synergize}
              scrollToTimeline={scrollToTimeline}
              itemId={match.itemId}
              index={index + 1}
              totalMatches={matches.length}
              allTopics={allTopics}
              getAllTopics={getAllTopics}
            />
          ))}
        </j-flex>
      )}
    </div>
  );
}
