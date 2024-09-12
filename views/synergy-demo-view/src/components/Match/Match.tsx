import { ConversationSubgroup, SubjectRepository } from "@coasys/flux-api";
import { getSubgroupItems, transformItem } from "@coasys/flux-utils";
import { useEffect, useState } from "preact/hooks";
import Avatar from "../Avatar";
import PercentageRing from "../PercentageRing";
import styles from "./Match.module.scss";

type Props = {
  perspective: any;
  agent: any;
  match: any;
};

export default function Match({ perspective, agent, match }: Props) {
  const { id, author, timestamp, channel, type, score } = match;
  const [data, setData] = useState(null);

  async function getConversationData() {
    const conversationProxy = await perspective.getSubjectProxy(id, type);
    const subgroups = await new SubjectRepository(ConversationSubgroup, {
      perspective,
      source: id,
    }).getAllData();
    const conversation = {
      id,
      author,
      timestamp,
      summary: await conversationProxy.summary,
      name: await conversationProxy.conversationName,
      subgroups: subgroups.slice(-3),
    };
    setData(conversation);
  }

  async function getSubgroupData() {
    const subgroupProxy = await perspective.getSubjectProxy(id, type);
    const subgroupItems = await getSubgroupItems(perspective, id);
    const subgroup = {
      id,
      author,
      timestamp,
      summary: await subgroupProxy.summary,
      name: await subgroupProxy.subgroupName,
      items: subgroupItems.slice(-3),
    };
    setData(subgroup);
  }

  async function getItemData() {
    const itemProxy = await perspective.getSubjectProxy(id, type);
    const item = {
      id,
      author,
      timestamp,
      body: await itemProxy.body,
      title: await itemProxy.title,
      name: await itemProxy.name,
    };
    setData(transformItem(type, item));
  }

  useEffect(() => {
    if (type === "Conversation") getConversationData();
    else if (type === "ConversationSubgroup") getSubgroupData();
    else getItemData();
  }, []);

  // todo: create seperate components for groupings
  if (type === "Conversation")
    return (
      <div className={styles.wrapper}>
        <j-flex direction="column" gap="400">
          <j-flex gap="300" a="center">
            <Avatar size="xs" did={author} />
            <p>|</p>
            <b>{channel.name || "subgroup needs linking"}</b>
          </j-flex>
          <j-flex gap="300">
            <PercentageRing ringSize={80} fontSize={12} score={score * 100} />
            <j-flex direction="column" gap="300" style={{ overflow: "hidden" }}>
              <h1>{data?.name}</h1>
              <p>{data?.summary}</p>
            </j-flex>
          </j-flex>
          <j-flex direction="column" gap="400">
            {data?.subgroups.map((subgroup) => (
              <div className={styles.item}>
                <h1>{subgroup.subgroupName}</h1>
                <p>{subgroup.summary}</p>
              </div>
            ))}
          </j-flex>
        </j-flex>
      </div>
    );
  if (type === "ConversationSubgroup")
    return (
      <div className={styles.wrapper}>
        <j-flex direction="column" gap="400">
          <j-flex gap="300" a="center">
            <Avatar size="xs" did={author} />
            <p>|</p>
            <b>{channel.name || "subgroup needs linking"}</b>
          </j-flex>
          <j-flex gap="300">
            <PercentageRing ringSize={80} fontSize={12} score={score * 100} />
            <j-flex direction="column" gap="300">
              <h1>{data?.name}</h1>
              <p>{data?.summary}</p>
            </j-flex>
          </j-flex>
          <j-flex direction="column" gap="400">
            {data?.items.map((item) => (
              <div className={styles.item}>
                <j-flex gap="300" a="center">
                  <j-icon name={item.icon} color="ui-500" />
                  <Avatar size="xs" did={item.author} />
                  <j-timestamp value={item.timestamp} relative className={styles.timestamp} />
                </j-flex>
                <j-text
                  nomargin
                  dangerouslySetInnerHTML={{ __html: item.text }}
                  className={styles.text}
                  color="color-white"
                />
              </div>
            ))}
          </j-flex>
        </j-flex>
      </div>
    );
  return (
    <div className={styles.wrapper}>
      <PercentageRing ringSize={80} fontSize={12} score={score * 100} />
      <j-flex gap="300" direction="column">
        <j-flex gap="400" a="center">
          <j-icon name={data?.icon} color="ui-500" />
          <Avatar size="xs" did={author} />
          <p>|</p>
          <b>{channel.name || "subgroup needs linking"}</b>
        </j-flex>
        <j-text
          nomargin
          dangerouslySetInnerHTML={{ __html: data?.text }}
          className={styles.text}
          color="color-white"
        />
      </j-flex>
    </div>
  );
}
