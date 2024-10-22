import { useSubjects } from "@coasys/ad4m-react-hooks";
import { useEffect, useState } from "preact/hooks";
import Vote from "../../models/Vote";
import Avatar from "../Avatar";
import styles from "./AnswerCard.module.scss";

export default function AnswerCard(props: {
  agent: any;
  perspective: any;
  answer: any;
  removeAnswer?: (index: number) => void;
  rerender?: () => void;
}) {
  const { agent, perspective, answer, removeAnswer, rerender } = props;
  const { index, color, percentage } = answer;
  const { author, text } = answer;
  const [userVoteId, setUserVoteId] = useState("");
  const { entries: votes, repo: voteRepo } = useSubjects({ perspective, source: answer.id, subject: Vote });

  function vote() {
    if (userVoteId) voteRepo.remove(userVoteId).then(() => rerender());
    // @ts-ignore
    else voteRepo.create({ value: null }).then(() => rerender());
  }

  async function findUserVote() {
    const { did } = await agent.me();
    const match = votes.find((vote) => vote.author === did);
    setUserVoteId(match?.id || "");
  }

  useEffect(() => {
    findUserVote();
  }, [JSON.stringify(votes)]);

  return (
    <j-flex gap="400" direction="column" className={styles.wrapper}>
      <j-flex j="between">
        <j-flex gap="400" a="center">
          <div className={styles.index} style={{ backgroundColor: color }}>
            {index + 1}
          </div>
          <Avatar size="sm" did={author} showName />
        </j-flex>

        <j-flex gap="400" a="center">
          <j-flex gap="400" a="center" className={styles.voters}>
            {votes.map((vote, i) => (
              <Avatar did={vote.author} size="xs" style={{ marginLeft: i > 0 ? -10 : 0 }} />
            ))}
            {percentage}%
          </j-flex>
          {removeAnswer ? (
            <j-button square>
              <j-icon name="trash" onClick={() => removeAnswer(index)}></j-icon>
            </j-button>
          ) : (
            <j-checkbox onChange={vote} checked={!!userVoteId} size="sm">
              <j-icon slot="checkmark" size="xs" name="check" />
            </j-checkbox>
          )}
        </j-flex>
      </j-flex>

      <j-text size="500" nomargin>
        {text}
      </j-text>
    </j-flex>
  );
}
