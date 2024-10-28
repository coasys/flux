import { AgentClient } from "@coasys/ad4m";
import { useSubjects } from "@coasys/ad4m-react-hooks";
import { useEffect, useState } from "preact/hooks";
import DecisionTree from "../../models/DecisionTree";
import DecisionTreeCard from "../DecisionTreeCard";
import NewDecisionTreeModal from "../NewDecisionTreeModal";

type Props = {
  agent: AgentClient;
  perspective: any;
  source: string;
};

export default function DecisionTreeView({ perspective, source, agent }: Props) {
  const [myDid, setMyDid] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { entries: decisionTrees, repo: decisionTreeRepo } = useSubjects({
    perspective,
    source,
    subject: DecisionTree,
  });

  function deleteTree(id: string) {
    decisionTreeRepo.remove(id).catch(console.log);
  }

  useEffect(() => {
    agent.me().then((data) => setMyDid(data.did));
  }, []);

  useEffect(() => {
    console.log("decisionTrees: ", decisionTrees);
  }, [decisionTrees]);

  return (
    <j-flex gap="600" direction="column">
      <j-text size="600" weight="800" color="primary-500" uppercase nomargin>
        Decision Trees
      </j-text>

      <j-button variant="primary" onClick={() => setModalOpen(true)}>
        New Decision Tree
      </j-button>

      <NewDecisionTreeModal
        perspective={perspective}
        source={source}
        myDid={myDid}
        open={modalOpen}
        setOpen={setModalOpen}
      />

      <j-flex gap="500" direction="column">
        {decisionTrees.map((tree) => (
          <DecisionTreeCard key={tree.id} perspective={perspective} myDid={myDid} tree={tree} deleteTree={deleteTree} />
        ))}
      </j-flex>
    </j-flex>
  );
}
