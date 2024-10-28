import { useSubjects } from "@coasys/ad4m-react-hooks";
import { useState } from "preact/hooks";
import DecisionTree from "../../models/DecisionTree";
import styles from "./NewDecisionTreeModal.module.scss";

type Props = {
  perspective: any;
  source: string;
  myDid: string;
  open: boolean;
  setOpen: (state: boolean) => void;
};

type VoteTypes = "single-choice" | "multiple-choice" | "weighted-choice";
const voteTypes = ["single-choice", "multiple-choice", "weighted-choice"] as VoteTypes[];

export default function NewDecisionTreeModal({ perspective, source, myDid, open, setOpen }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [voteType, setVoteType] = useState<VoteTypes>(voteTypes[0]);
  const [answersLocked, setAnswersLocked] = useState(true);
  const [titleError, setTitleError] = useState("");
  const [loading, setLoading] = useState(false);
  const { repo: decisionTreeRepo } = useSubjects({ perspective, source, subject: DecisionTree });

  function toggleOpen(open: boolean) {
    setOpen(open);
    if (!open) {
      // reset state
      setTitle("");
      setDescription("");
      setVoteType(voteTypes[0]);
      setTitleError("");
      setLoading(false);
    }
  }

  async function createDecisionTree() {
    setTitleError(title ? "" : "Required");
    if (title) {
      setLoading(true);
      decisionTreeRepo
        // @ts-ignore
        .create({ title, description, voteType, answersLocked })
        .then(() => toggleOpen(false))
        .catch(console.log);
    }
  }

  return (
    // @ts-ignore
    <j-modal open={open} onToggle={(e) => toggleOpen(e.target.open)}>
      <j-box m="700">
        <j-flex direction="column" gap="600" a="center">
          <j-text variant="heading-lg">New Decision Tree</j-text>

          <j-flex direction="column" gap="500" style={{ alignSelf: "stretch" }}>
            <j-input
              label="Title"
              value={title}
              onChange={(e) => setTitle((e.target as HTMLTextAreaElement).value)}
              errortext={titleError}
              error={!!titleError}
            />

            <j-input
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
            />

            <j-flex className={styles.outline} gap="400" direction="column">
              <j-flex gap="300" a="center">
                <j-icon name="gear" />
                <j-text variant="heading-sm" nomargin>
                  Settings
                </j-text>
              </j-flex>
              <j-flex gap="600" a="center">
                {voteTypes.map((type) => (
                  <j-checkbox onChange={() => setVoteType(type)} checked={voteType === type} size="sm">
                    <j-text nomargin>{type}</j-text>
                    <j-icon slot="checkmark" size="xs" name="check"></j-icon>
                  </j-checkbox>
                ))}
              </j-flex>
              <j-toggle checked={!answersLocked} onChange={() => setAnswersLocked(!answersLocked)}>
                Allow people to add their own answers
              </j-toggle>
            </j-flex>
          </j-flex>

          <j-button variant="primary" onClick={createDecisionTree} loading={loading} disabled={loading}>
            Create Decision Tree
          </j-button>
        </j-flex>
      </j-box>
    </j-modal>
  );
}
