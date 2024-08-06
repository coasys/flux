import { useSubjects } from "@coasys/ad4m-react-hooks";
import { useAgent } from "@coasys/flux-react-web";
import { profileFormatter } from "@coasys/flux-utils";
import OpenAI from "openai";
import { useState } from "preact/hooks";
import Intent from "../../models/Intent";
import Meaning from "../../models/Meaning";
import Topic from "../../models/Topic";
import Avatar from "../Avatar";
import styles from "./TimelineItem.module.scss";

type Props = {
  agent: any;
  perspective: any;
  item: any;
  index: number;
  match: boolean;
  selected: boolean;
  setSelected: () => void;
  synergize: (item: any, topic: string) => void;
};

const prompt =
  "Analyse the following block of text and return only a JSON object containing three values: topics, meaning, and intent. Topics will be a array of up to 5 strings (one word each in lowercase) describing the topic of the content. Meaning will be a max 3 sentence string summarising the meaning of the content. And Intent will be a single sentence string guessing the intent of the text. :<br/> <br/>";

export default function TimelineItem({
  agent,
  perspective,
  item,
  index,
  match,
  selected,
  setSelected,
  synergize,
}: Props) {
  const { type, id, timestamp, author, text, icon } = item;
  const [processing, setProcessing] = useState(false);

  const { profile } = useAgent({
    client: agent,
    did: author,
    //@ts-ignore
    formatter: profileFormatter,
  });

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

  // useEffect(() => {
  //   console.log("items: ", topics);
  // }, [topics]);

  // useEffect(() => {
  //   console.log("profile: ", profile);
  // }, [profile]);

  async function process() {
    setProcessing(true);
    // send prompt & item text to Open AI
    const openai = new OpenAI({
      apiKey: localStorage?.getItem("openAIKey"),
      dangerouslyAllowBrowser: true,
    });
    openai.chat.completions
      .create({
        messages: [{ role: "user", content: `${prompt} ${text}` }],
        model: "gpt-3.5-turbo",
      })
      .then(async (response) => {
        console.log("raw response: ", response);
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
            setProcessing(false);
          })
          .catch(console.log);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return (
    <div
      id={`${index}-${item.id}`}
      className={`${styles.wrapper} ${selected && styles.selected} ${match && styles.match}`}
    >
      <button className={styles.button} onClick={setSelected} />
      <div className={styles.timestamp}>
        <j-timestamp value={timestamp} dateStyle="short" timeStyle="short" />
      </div>
      <div className={styles.position}>
        <div className={styles.node} />
        <div className={styles.line} />
      </div>
      <div className={styles.content}>
        <j-flex gap="400" a="center">
          <j-icon name={icon} />
          <Avatar size="sm" did={author} profile={profile} />
          {!selected && (
            <j-flex gap="300">
              {topics.map((t) => (
                <j-button
                  size="sm"
                  onClick={() => {
                    setSelected();
                    synergize(item, t.topic);
                  }}
                >
                  #{t.topic}
                </j-button>
              ))}
            </j-flex>
          )}
        </j-flex>
        {selected && (
          <j-flex direction="column" gap="300">
            <j-text nomargin dangerouslySetInnerHTML={{ __html: text }} />
            {topics.length ? (
              <div className={styles.processedData}>
                {topics.length > 0 && (
                  <j-box>
                    <j-text
                      uppercase
                      size="300"
                      weight="800"
                      color="primary-500"
                    >
                      Topics
                    </j-text>
                    <j-flex gap="400">
                      {topics.map((t) => (
                        <j-button
                          size="sm"
                          onClick={() => {
                            setSelected();
                            synergize(item, t.topic);
                          }}
                        >
                          #{t.topic}
                        </j-button>
                      ))}
                    </j-flex>
                  </j-box>
                )}

                {meanings.length > 0 && (
                  <j-box mt="600">
                    <j-text
                      uppercase
                      size="300"
                      weight="800"
                      color="primary-500"
                    >
                      Meaning
                    </j-text>
                    <j-text>{meanings[0].meaning}</j-text>
                  </j-box>
                )}

                {intents.length > 0 && (
                  <j-box mt="600">
                    <j-text
                      uppercase
                      size="300"
                      weight="800"
                      color="primary-500"
                    >
                      Intent
                    </j-text>
                    <j-text nomargin>{intents[0].intent}</j-text>
                  </j-box>
                )}
              </div>
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
          </j-flex>
        )}
      </div>
    </div>
  );
}
