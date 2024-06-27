import { useSubjects } from "@coasys/ad4m-react-hooks";
import { Channel, SubjectRepository } from "@coasys/flux-api";
import OpenAI from "openai";
import { useEffect, useState } from "preact/hooks";
import Intent from "../../models/Intent";
import Meaning from "../../models/Meaning";
import Topic from "../../models/Topic";
import { transformItem } from "./../../utils";
import styles from "./Item.module.css";

type Props = {
  perspective: any;
  source: any;
  item: any;
  openAIKey: string;
};

const prompt =
  "Analyse the following block of text and return only a JSON object containing three values: topics, meaning, and intent. Topics will be a array of up to 5 strings (one word each in lowercase) describing the topic of the content. Meaning will be a max 3 sentence string summarising the meaning of the content. And Intent will be a single sentence string guessing the intent of the text. :<br/> <br/>";

export default function Item({ perspective, source, item, openAIKey }: Props) {
  const { type, id, timestamp, text, icon } = item;
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [synergizing, setSynergizing] = useState(false);
  const [synergized, setSynergized] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [openAIKeyError, setOpenAIKeyError] = useState("");
  const { entries: topics, repo: topicRepo } = useSubjects({
    perspective,
    source: id,
    subject: Topic,
  });
  const { entries: meanings, repo: meaningRepo } = useSubjects({
    perspective,
    source: id,
    subject: Meaning,
  });
  const { entries: intents, repo: intentRepo } = useSubjects({
    perspective,
    source: id,
    subject: Intent,
  });

  async function process() {
    setOpenAIKeyError("");
    setProcessing(true);
    // send prompt & item text to Open AI
    const openai = new OpenAI({
      apiKey: openAIKey,
      dangerouslyAllowBrowser: true,
    });
    openai.chat.completions
      .create({
        messages: [{ role: "user", content: `${prompt} ${text}` }],
        model: "gpt-3.5-turbo",
      })
      .then(async (response) => {
        const data = JSON.parse(response.choices[0].message.content);
        console.log("Open AI response: ", data);
        // store results as linked topic, meaning, & intent expressions
        const createTopics = await Promise.all(
          data.topics.map((topic) =>
            topicRepo
              // @ts-ignore
              .create({ topic })
              .then((expression) =>
                perspective.add({
                  source: id,
                  predicate: "flux://has_topic",
                  // @ts-ignore
                  target: expression.id,
                })
              )
          )
        );

        const createMeaning = await meaningRepo
          // @ts-ignore
          .create({ meaning: data.meaning })
          .then((expression) => {
            perspective.add({
              source: id,
              predicate: "flux://has_meaning",
              // @ts-ignore
              target: expression.id,
            });
          });

        const createIntent = await intentRepo
          // @ts-ignore
          .create({ intent: data.intent })
          .then((expression) =>
            perspective.add({
              source: id,
              predicate: "flux://has_intent",
              // @ts-ignore
              target: expression.id,
            })
          );

        Promise.all([createTopics, createMeaning, createIntent])
          .then(() => {
            setProcessed(true);
            setProcessing(false);
          })
          .catch(console.log);
      })
      .catch((error) => {
        console.log(error);
        if (error.status === 401)
          setOpenAIKeyError("Enter a valid OpenAI key at the top of the page");
        if (error.status === 429)
          setOpenAIKeyError("Your OpenAI key has run out of credits");
        setProcessing(false);
      });
  }

  async function findMatches(
    channelId: string,
    subjectClass: string
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
                if (topics.map((t) => t.topic).includes(it.topic))
                  newMatches.push(transformItem(subjectClass, instance));
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

  async function synergize() {
    // searches other channels in the neighbourhood to find items with matching topic tags
    setSynergizing(true);

    const channels = await new SubjectRepository(Channel, {
      perspective,
    }).getAllData();

    let newMatches = [];
    Promise.all(
      channels
        .filter((channel: any) => channel.id !== source)
        .map(
          (channel: any) =>
            new Promise(async (resolve: any) => {
              const messageMatches = await findMatches(channel.id, "Message");
              const postMatches = await findMatches(channel.id, "Post");
              const taskMatches = await findMatches(channel.id, "Task");
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
      setSynergizing(false);
      setSynergized(true);
    });
  }

  useEffect(() => {
    if ((topics.length || meanings.length || intents.length) && !processed) {
      setProcessed(true);
    }
  }, [topics, meanings, intents]);

  return (
    <div className={styles.item}>
      <j-box mb="400">
        <j-flex j="between" a="center">
          <j-flex a="center" gap="300">
            <j-icon name={icon} />
            <j-text size="500" nomargin>
              {type}
            </j-text>
          </j-flex>
          <j-timestamp value={timestamp} relative />
        </j-flex>
      </j-box>

      <j-text size="500" style={{ wordBreak: "break-word" }}>
        {text}
      </j-text>

      {processed && (
        <j-box mt="400" mb="400">
          <div className={styles.processedData}>
            {topics.length > 0 && (
              <j-box>
                <j-text uppercase size="300" weight="800" color="primary-500">
                  Topics
                </j-text>
                <j-flex gap="400">
                  {topics.map((t) => (
                    <j-button size="sm">#{t.topic}</j-button>
                  ))}
                </j-flex>
              </j-box>
            )}

            {meanings.length > 0 && (
              <j-box mt="600">
                <j-text uppercase size="300" weight="800" color="primary-500">
                  Meaning
                </j-text>
                <j-text>{meanings[0].meaning}</j-text>
              </j-box>
            )}

            {intents.length > 0 && (
              <j-box mt="600">
                <j-text uppercase size="300" weight="800" color="primary-500">
                  Intent
                </j-text>
                <j-text nomargin>{intents[0].intent}</j-text>
              </j-box>
            )}
          </div>
        </j-box>
      )}

      {synergized && (
        <j-box mt="400" mb="400">
          {matches.length > 0 ? (
            <j-box mt="400" mb="400">
              <div className={styles.matches}>
                <j-text uppercase size="300" weight="800" color="primary-500">
                  Matches
                </j-text>
                <j-flex direction="column" gap="400">
                  {matches.map((match) => (
                    <Item
                      perspective={perspective}
                      source={source}
                      item={match}
                      openAIKey={openAIKey}
                    />
                  ))}
                </j-flex>
              </div>
            </j-box>
          ) : (
            <j-box mt="400" mb="400">
              <div className={styles.matches}>
                <j-text
                  uppercase
                  nomargin
                  size="300"
                  weight="800"
                  color="primary-500"
                >
                  No matches found
                </j-text>
              </div>
            </j-box>
          )}
        </j-box>
      )}

      {processed ? (
        <j-button
          variant="primary"
          size="sm"
          onClick={synergize}
          loading={synergizing}
        >
          {synergized ? "Re-synergize!" : "Synergize!"}
        </j-button>
      ) : (
        <j-button
          variant="primary"
          size="sm"
          onClick={process}
          loading={processing}
        >
          Process
        </j-button>
      )}

      {openAIKeyError && (
        <div className={styles.error}>
          <j-flex a="center" gap="300">
            <j-icon
              name="exclamation-circle"
              size="xs"
              color="warning-400"
            ></j-icon>
            <j-text nomargin weight="700" size="400" color="warning-400">
              {openAIKeyError}
            </j-text>
          </j-flex>
        </div>
      )}
    </div>
  );
}
