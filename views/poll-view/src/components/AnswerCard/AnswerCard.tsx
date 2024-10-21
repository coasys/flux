import { useSubjects } from "@coasys/ad4m-react-hooks";
import { useEffect, useState } from "preact/hooks";
import Vote from "../../models/Vote";
import styles from "./AnswerCard.module.css";

const angentDID = "did:key:z6MkjphiWxN3223q44dCJnugFuivcLadc5NH8EejWZtGWiKR";

export default function AnswerCard(props: {
  perspective: any;
  answer: any;
  index: number;
  color: string;
  removeAnswer?: (index: number) => void;
  vote?: (answerId: string, voteId: string) => Promise<any>;
}) {
  const { perspective, answer, index, color, removeAnswer, vote } = props;
  const [checked, setChecked] = useState(false);

  const { entries: votes } = useSubjects({
    perspective,
    source: answer.id,
    subject: Vote,
  });

  // console.log("votes: ", votes);

  function handleVote(e: any) {
    const voteId = e.target.checked ? "" : votes.find((vote) => vote.author === angentDID).id;
    vote(answer.id, voteId)
      .then((data) => {
        console.log("success:", data);
        // setChecked(!voteId);
      })
      .catch((error) => console.log("vote error", error));
  }

  // todo: get agent data properly (agent not included in plugin props?)
  useEffect(() => {
    // const agent = useAgent()
    const match = votes.find((vote) => vote.author === angentDID);
    setChecked(!!match);
  }, [votes]);

  return (
    <div className={styles.answer}>
      <div className={styles.index} style={{ backgroundColor: color }}>
        {index + 1}
      </div>
      <j-text size="500" nomargin>
        {answer.text}
      </j-text>
      {removeAnswer && (
        <j-button square style={{ marginLeft: "var(--j-space-400)" }}>
          <j-icon name="trash" onClick={() => removeAnswer(index)}></j-icon>
        </j-button>
      )}
      {vote && (
        <j-checkbox
          onChange={handleVote}
          checked={checked}
          size="sm"
          style={{ marginLeft: "var(--j-space-400)" }}
        >
          <j-icon slot="checkmark" size="xs" name="check"></j-icon>
        </j-checkbox>
      )}
    </div>
  );
}
