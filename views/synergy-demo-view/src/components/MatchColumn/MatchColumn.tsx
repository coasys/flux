import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";
import { Profile } from "@coasys/flux-types";
import {
  FilterSettings,
  GroupingOption,
  groupingOptions,
  ItemType,
  itemTypeOptions,
  SearchType,
  SynergyMatch,
} from "@coasys/flux-utils";
import { useEffect, useState } from "preact/hooks";
import { ChevronDownSVG, closeMenu } from "../../utils";
import Match from "../Match";
import styles from "./MatchColumn.module.scss";

type Props = {
  perspective: any;
  agent: AgentClient;
  matches: SynergyMatch[];
  selectedTopicId: string;
  searchType: SearchType;
  filterSettings: FilterSettings;
  setFilterSettings: (newSettings: FilterSettings) => void;
  matchText: () => string;
  close: () => void;
  getProfile: (did: string) => Promise<Profile>;
};

export default function MatchColumn({
  perspective,
  agent,
  matches,
  selectedTopicId,
  searchType,
  filterSettings,
  setFilterSettings,
  matchText,
  close,
  getProfile,
}: Props) {
  const { grouping, itemType, includeChannel } = filterSettings;
  const [numberOfMatchesDisplayed, setNumberOfMatchesDisplayed] = useState(5);
  const filteredGroupingOptions = searchType === "topic" ? ["Conversations", "Subgroups"] : groupingOptions;

  useEffect(() => setNumberOfMatchesDisplayed(5), [matches]);

  return (
    <div className={styles.wrapper}>
      <j-flex direction="column" gap="400" className={styles.header}>
        <j-flex a="center" gap="400" wrap>
          <j-menu style={{ height: 42, zIndex: 20 }}>
            <j-menu-group collapsible title={grouping} id="grouping-menu">
              {filteredGroupingOptions.map((option: GroupingOption) => (
                <j-menu-item
                  selected={grouping === option}
                  onClick={() => {
                    setFilterSettings({ ...filterSettings, grouping: option });
                    closeMenu("grouping-menu");
                  }}
                >
                  {option}
                </j-menu-item>
              ))}
            </j-menu-group>
          </j-menu>
          {grouping === "Items" && (
            <j-menu style={{ height: 42, zIndex: 20 }}>
              <j-menu-group collapsible title={itemType} id="item-type-menu">
                {itemTypeOptions.map((option: ItemType) => (
                  <j-menu-item
                    selected={itemType === option}
                    onClick={() => {
                      setFilterSettings({ ...filterSettings, itemType: option });
                      closeMenu("item-type-menu");
                    }}
                  >
                    {option}
                  </j-menu-item>
                ))}
              </j-menu-group>
            </j-menu>
          )}
          <j-checkbox
            checked={includeChannel}
            onChange={() => setFilterSettings({ ...filterSettings, includeChannel: !includeChannel })}
          >
            Include Channel
          </j-checkbox>
          <button className={styles.closeButton} onClick={close}>
            <j-icon name="x" color="color-white" />
          </button>
        </j-flex>
        <h2>{matchText()}</h2>
      </j-flex>
      <j-flex direction="column" gap="400" className={styles.results}>
        {matches.slice(0, numberOfMatchesDisplayed).map((match, index) => (
          <Match
            key={index}
            perspective={perspective}
            agent={agent}
            match={match}
            index={index}
            grouping={grouping}
            selectedTopicId={selectedTopicId}
            getProfile={getProfile}
          />
        ))}
        {matches.length > numberOfMatchesDisplayed && (
          <j-button className={styles.showMoreButton} onClick={() => setNumberOfMatchesDisplayed((prev) => prev + 5)}>
            See more
            <span>
              <ChevronDownSVG /> {matches.length - numberOfMatchesDisplayed}
            </span>
          </j-button>
        )}
      </j-flex>
    </div>
  );
}
