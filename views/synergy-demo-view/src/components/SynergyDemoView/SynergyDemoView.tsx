import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { useState } from "preact/hooks";
import Timeline from "../Timeline";
import styles from "./SynergyDemoView.module.scss";
// import { PerspectiveProxy } from "@coasys/ad4m";
import { Channel, SubjectRepository } from "@coasys/flux-api";
import { useEffect } from "preact/hooks";
import Topic from "../../models/Topic";

type Props = {
  perspective: any; // PerspectiveProxy;
  source: string;
  agent: AgentClient;
};

export default function SynergyDemoView({ perspective, agent, source }: Props) {
  const [openAIKey, setOpenAIKey] = useState(
    localStorage?.getItem("openAIKey") || ""
  );
  const [matches, setMatches] = useState<any[]>([]);
  const [topic, setTopic] = useState("");

  async function findMatches(
    channel: any,
    subjectClass: string,
    topic: string
  ): Promise<any[]> {
    // searches for instances of the subject class with matching topics in the channel
    return await new Promise(async (resolveMatches: any) => {
      const newMatches = [];
      const instances = await new SubjectRepository(subjectClass, {
        perspective,
        source: channel.id,
      }).getAllData();

      Promise.all(
        instances.map(
          (instance: any) =>
            new Promise(async (resolve: any) => {
              // fetch all topics attached to the instance
              const instanceTopics = await new SubjectRepository(Topic, {
                perspective,
                source: instance.id,
              }).getAllData();
              // search for matches with source topics
              instanceTopics.forEach((it: any) => {
                if (topic === it.topic)
                  newMatches.push({ channel, itemId: instance.id });
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

  useEffect(() => {
    setMatches([]);
  }, [source]);

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
      {window.innerWidth > 1200 ? (
        <j-flex className={styles.wrapper}>
          <div style={{ flexBasis: "50%", flexShrink: 0 }}>
            <Timeline
              agent={agent}
              perspective={perspective}
              channel={source}
              topic={topic}
              synergize={synergize}
              scrollToTimeline={scrollToTimeline}
              index={0}
              totalMatches={matches.length}
            />
          </div>
          <j-flex gap="500" className={styles.timelines}>
            {matches.map((match, index) => (
              <Timeline
                agent={agent}
                perspective={perspective}
                channel={match.channel}
                topic={topic}
                synergize={synergize}
                scrollToTimeline={scrollToTimeline}
                itemId={match.itemId}
                index={index + 1}
                totalMatches={matches.length}
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
            topic={topic}
            synergize={synergize}
            scrollToTimeline={scrollToTimeline}
            index={0}
            totalMatches={matches.length}
          />
          {matches.map((match, index) => (
            <Timeline
              agent={agent}
              perspective={perspective}
              channel={match.channel}
              topic={topic}
              synergize={synergize}
              scrollToTimeline={scrollToTimeline}
              itemId={match.itemId}
              index={index + 1}
              totalMatches={matches.length}
            />
          ))}
        </j-flex>
      )}
    </div>
  );
}
