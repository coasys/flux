import { groupingOptions, itemTypeOptions } from "../../utils";
import Match from "../Match";
import styles from "./MatchColumn.module.scss";

type Props = {
  perspective: any;
  agent: any;
  matches: any;
  selectedTopicId: string;
  filterSettings: any;
  setFilterSettings: (newSettings: any) => void;
  matchText: () => string;
};

export default function MatchColumn({
  perspective,
  agent,
  matches,
  selectedTopicId,
  filterSettings,
  setFilterSettings,
  matchText,
}: Props) {
  const { grouping, itemType, includeChannel } = filterSettings;
  return (
    <div className={styles.wrapper}>
      <j-flex direction="column" gap="400" className={styles.header}>
        <j-flex a="center" gap="400" wrap>
          <div style={{ height: 42, zIndex: 15 }}>
            <j-menu>
              <j-menu-group collapsible title={grouping}>
                {groupingOptions.map((option) => (
                  <j-menu-item
                    selected={grouping === option}
                    onClick={() => setFilterSettings({ ...filterSettings, grouping: option })}
                  >
                    {option}
                  </j-menu-item>
                ))}
              </j-menu-group>
            </j-menu>
          </div>
          {grouping === "Items" && (
            <j-menu>
              <j-menu-group collapsible title={itemType}>
                {itemTypeOptions.map((option) => (
                  <j-menu-item
                    selected={itemType === option}
                    onClick={() => setFilterSettings({ ...filterSettings, itemType: option })}
                  >
                    {option}
                  </j-menu-item>
                ))}
              </j-menu-group>
            </j-menu>
          )}
          <j-checkbox
            checked={includeChannel}
            onChange={() =>
              setFilterSettings({ ...filterSettings, includeChannel: !includeChannel })
            }
          >
            Include Channel
          </j-checkbox>
        </j-flex>
        <h2>{matchText()}</h2>
      </j-flex>
      <j-flex direction="column" gap="400" className={styles.results}>
        {matches.map((match, index) => (
          <Match
            key={index}
            perspective={perspective}
            agent={agent}
            match={match}
            index={index}
            selectedTopicId={selectedTopicId}
          />
        ))}
      </j-flex>
    </div>
  );
}
