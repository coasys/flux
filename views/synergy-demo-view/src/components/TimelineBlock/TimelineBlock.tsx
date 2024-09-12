import { useEffect, useState } from "preact/hooks";
import Avatar from "../Avatar";
import styles from "./TimelineBlock.module.scss";

function ChevronUpSVG() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fas"
      data-icon="chevron-up"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
    >
      <path
        fill="currentColor"
        d="M240.971 130.524l194.343 194.343c9.373 9.373 9.373 24.569 0 33.941l-22.667 22.667c-9.357 9.357-24.522 9.375-33.901.04L224 227.495 69.255 381.516c-9.379 9.335-24.544 9.317-33.901-.04l-22.667-22.667c-9.373-9.373-9.373-24.569 0-33.941L207.03 130.525c9.372-9.373 24.568-9.373 33.941-.001z"
      />
    </svg>
  );
}

function ChevronDownSVG() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fas"
      data-icon="chevron-down"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
    >
      <path
        fill="currentColor"
        d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
      />
    </svg>
  );
}

function CurveSVG() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="38"
      height="60"
      version="1.1"
      viewBox="0 0 10.054 15.875"
    >
      <g transform="translate(-3.39 -5.533)">
        <path
          fill="none"
          stroke="currentColor"
          strokeDasharray="none"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit="4"
          strokeOpacity="1"
          strokeWidth="1.587"
          d="M4.185 5.533c0 10.349 8.466 4.714 8.466 15.876"
        />
      </g>
    </svg>
  );
}

type Props = {
  agent: any;
  perspective: any;
  data: any;
  zoom: string;
  selectedTopicId: string;
  selectedItemId: string;
  setSelectedItemId: (id: string) => void;
  search: (type: "topic" | "vector", id: string) => void;
};

export default function TimelineBlock({
  agent,
  perspective,
  data,
  zoom,
  selectedTopicId,
  selectedItemId,
  setSelectedItemId,
  search,
}: Props) {
  const { id, type, timestamp, start, end, author, participants, topics, children } = data;
  const [showChildren, setShowChildren] = useState(false);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    setSelected(selectedItemId === id);
  }, [selectedItemId]);

  useEffect(() => {
    if (zoom === "Conversations") setShowChildren(false);
    else if (zoom === "Subgroups") setShowChildren(type === "conversation");
    else if (["conversation", "subgroup"].includes(type)) setShowChildren(true);
  }, [zoom]);

  return (
    <div
      id={`timeline-block-${id}`}
      className={`${styles.block} ${["conversation", "subgroup"].includes(type) ? styles[type] : styles.item}`}
    >
      <button className={styles.button} onClick={() => setSelectedItemId(selected ? null : id)} />
      {type === "conversation" && (
        <j-timestamp value={timestamp} relative className={styles.timestamp} />
      )}
      {type === "subgroup" && (
        <span className={styles.timestamp}>
          {((new Date(end).getTime() - new Date(start).getTime()) / 1000 / 60).toFixed(1)} mins
        </span>
      )}
      {!["conversation", "subgroup"].includes(type) && (
        <j-timestamp value={timestamp} timeStyle="short" className={styles.timestamp} />
      )}
      <div className={styles.position}>
        {!showChildren && <div className={`${styles.node} ${selected && styles.selected}`} />}
        <div className={`${styles.line} ${showChildren && styles.showChildren}`} />
      </div>
      {["conversation", "subgroup"].includes(type) ? (
        <j-flex direction="column" gap="300" className={styles.content}>
          <j-flex
            direction="column"
            gap="300"
            className={`${styles.card} ${selected && styles.selected}`}
          >
            <j-flex a="center" gap="400">
              <h1>{data[`${type}Name`]}</h1>
              <button className={styles.caret} onClick={() => setShowChildren(!showChildren)}>
                {showChildren ? <ChevronUpSVG /> : <ChevronDownSVG />}
                {children.length}
              </button>
            </j-flex>
            <p className={styles.summary}>{data.summary}</p>
            <j-flex className={styles.participants}>
              {participants.map((p, i) => (
                <Avatar did={p} style={{ marginLeft: i > 0 ? -10 : 0 }} />
              ))}
            </j-flex>
            {selected && (
              <j-flex gap="300" wrap style={{ marginTop: 5 }}>
                {data.topics.map((topic) => (
                  <button
                    className={`${styles.tag} ${selectedTopicId === topic.id && styles.focus}`}
                    onClick={() => search("topic", topic)}
                  >
                    #{topic.name}
                  </button>
                ))}
                <button
                  className={`${styles.tag} ${styles.vector}`}
                  onClick={() => search("vector", data)}
                >
                  <j-icon
                    name="flower2"
                    color="color-success-500"
                    size="sm"
                    style={{ marginRight: 5 }}
                  />
                  Synergize
                </button>
              </j-flex>
            )}
          </j-flex>
          {children.length > 0 && showChildren && (
            <div className={styles.children}>
              <div className={styles.curveTop}>
                <CurveSVG />
              </div>
              {children.map((child) => (
                <TimelineBlock
                  agent={agent}
                  perspective={perspective}
                  data={child}
                  zoom={zoom}
                  selectedTopicId={selectedTopicId}
                  selectedItemId={selectedItemId}
                  setSelectedItemId={setSelectedItemId}
                  search={search}
                />
              ))}
              <div className={styles.curveBottom}>
                <CurveSVG />
              </div>
            </div>
          )}
        </j-flex>
      ) : (
        <j-flex
          gap="400"
          a="center"
          className={`${styles.itemCard} ${selected && styles.selected}`}
        >
          <j-icon name={data.icon} color="ui-400" size="lg" />
          <j-flex gap="400" direction="column">
            <j-flex gap="400" a="center" wrap>
              <Avatar did={author} showName />
            </j-flex>
            <j-text
              nomargin
              dangerouslySetInnerHTML={{ __html: data.text }}
              className={styles.itemText}
              color="color-white"
            />
            {selected && (
              <j-flex gap="300" wrap>
                {topics.map((topic) => (
                  <button
                    className={`${styles.tag} ${selected && selectedTopicId === topic.id && styles.focus}`}
                    onClick={() => search("topic", topic)}
                  >
                    #{topic.name}
                  </button>
                ))}
                <button
                  className={`${styles.tag} ${styles.vector}`}
                  onClick={() => search("vector", data)}
                >
                  <j-icon
                    name="flower2"
                    color="color-success-500"
                    size="sm"
                    style={{ marginRight: 5 }}
                  />
                  Synergize
                </button>
              </j-flex>
            )}
          </j-flex>
        </j-flex>
      )}
    </div>
  );
}
