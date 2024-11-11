import { useSubjects } from "@coasys/ad4m-react-hooks";
import { useEffect, useState } from "preact/hooks";
import DecisionTreeModel from "../../models/DecisionTree";
import Avatar from "../Avatar";
import DecisionTree from "../DecisionTree";
import styles from "./DecisionTreeCard.module.scss";

export default function DecisionTreeCard(props: {
  perspective: any;
  myDid: string;
  tree: any;
  deleteTree: (id: string) => void;
}) {
  const { perspective, myDid, tree, deleteTree } = props;
  const { id, author, timestamp, voteType } = tree;
  const [treeData, setTreeData] = useState(null);

  const { entries: children } = useSubjects({ perspective, source: tree.id, subject: DecisionTreeModel });

  async function buildTreeData() {
    //
  }

  useEffect(() => {
    buildTreeData();
  }, [JSON.stringify(children)]);

  return (
    <j-box p="600" className={styles.poll}>
      <j-flex direction="column" gap="400">
        <j-flex j="between">
          <j-flex gap="300" a="center">
            <Avatar size="sm" did={author} showName />
            <j-text nomargin>|</j-text>
            <j-text nomargin>
              <j-timestamp value={timestamp} relative />
            </j-text>
          </j-flex>
          {myDid === author && (
            <j-button square>
              <j-icon name="trash" onClick={() => deleteTree(tree.id)} />
            </j-button>
          )}
        </j-flex>
        <j-text variant="heading-sm" nomargin>
          {tree.title}
        </j-text>
        <j-text size="500" nomargin>
          {tree.description}
        </j-text>
        <j-flex j="between" a="center">
          <j-flex gap="300" a="center">
            <j-icon name="pie-chart" />
            <j-text nomargin>Vote type:</j-text>
            <j-text nomargin>
              <b>{voteType}</b>
            </j-text>
          </j-flex>
        </j-flex>
        <DecisionTree treeId={id} type={voteType} />
      </j-flex>
    </j-box>
  );
}
