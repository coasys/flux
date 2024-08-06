import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { useState } from "preact/hooks";
import Timeline from "../Timeline";
import styles from "./SynergyDemoView.module.css";
// import { PerspectiveProxy } from "@coasys/ad4m";
import { Channel, SubjectRepository } from "@coasys/flux-api";
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

  async function findMatches(
    channelId: string,
    subjectClass: string,
    topic: string
  ): Promise<any[]> {
    // searches for instances of the subject class with matching topics in the channel
    return await new Promise(async (resolveMatches: any) => {
      const newMatches = [];
      const instances = await new SubjectRepository(subjectClass, {
        perspective,
        source: channelId,
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
                  newMatches.push({ channelId, itemId: instance.id });
                // newMatches.push(
                //   transformItem(channelId, subjectClass, instance)
                // );
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
    console.log("synergize: ", item, topic);
    // searches other channels in the neighbourhood to find items with matching topic tags
    // setSynergizing(true);

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
                channel.id,
                "Message",
                topic
              );
              const postMatches = await findMatches(channel.id, "Post", topic);
              const taskMatches = await findMatches(channel.id, "Task", topic);
              newMatches.push(
                ...messageMatches,
                ...postMatches,
                ...taskMatches
              );
              resolve();
            })
        )
    ).then(() => {
      console.log("newMatches: ", newMatches);
      setMatches(newMatches);
      // setSynergizing(false);
      // setSynergized(true);
    });
  }

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
            onInput={(event) => {
              const value = (event.target as HTMLInputElement).value;
              setOpenAIKey(value);
              localStorage?.setItem("openAIKey", value);
            }}
          />
        </j-box>
        <j-flex gap="500">
          <Timeline
            agent={agent}
            perspective={perspective}
            channelId={source}
            // itemId={}
            synergize={synergize}
          />
          {matches.map((match, index) => (
            <Timeline
              agent={agent}
              perspective={perspective}
              channelId={match.channelId}
              itemId={match.itemId}
              index={index}
              synergize={synergize}
            />
          ))}
        </j-flex>
      </j-box>
    </div>
  );
}
