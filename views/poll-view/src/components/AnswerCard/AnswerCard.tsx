import { useSubjects } from "@coasys/ad4m-react-hooks";
import { useEffect, useRef, useState } from "preact/hooks";
import Vote from "../../models/Vote";
import Avatar from "../Avatar";
import styles from "./AnswerCard.module.scss";

export default function AnswerCard(props: {
  perspective: any;
  myDid: string;
  answer: any;
  index: number;
  color: string;
  percentage?: number;
  voteType?: string;
  preview?: boolean;
  vote?: (answerId: string, value?: number) => void;
  removeAnswer?: (index: number) => void;
}) {
  const { perspective, myDid, answer, index, color, percentage, voteType, preview, vote, removeAnswer } = props;
  const { id, author, text, myPoints } = answer;
  const [hasVoted, setHasVoted] = useState(false);
  const [points, setPoints] = useState(myPoints);
  const pointsRef = useRef(0);
  const slidingRef = useRef(false);
  const { entries: votes } = useSubjects({ perspective, source: answer.id, subject: Vote });

  useEffect(() => {
    window.addEventListener("mouseup", () => {
      if (slidingRef.current) {
        slidingRef.current = false;
        vote(id, pointsRef.current);
      }
    });
  }, []);

  useEffect(() => {
    setHasVoted(!!votes.find((vote) => vote.author === myDid));
  }, [myDid, JSON.stringify(votes)]);

  return (
    <j-flex gap="400" direction="column" className={styles.wrapper}>
      <j-flex j="between">
        <j-flex gap="400" a="center">
          <div className={styles.index} style={{ backgroundColor: color }}>
            {index + 1}
          </div>
          <Avatar size="sm" did={preview ? myDid : author} showName />
        </j-flex>

        <j-flex gap="400" a="center">
          {preview ? (
            <j-button square>
              <j-icon name="trash" onClick={() => removeAnswer(index)}></j-icon>
            </j-button>
          ) : (
            <>
              <j-flex gap="300" a="center" className={styles.voters}>
                {votes.length > 0 && (
                  <j-flex a="center">
                    {votes.map((vote, i) => (
                      <Avatar did={vote.author} size="xs" style={{ marginLeft: i > 0 ? -10 : 0 }} />
                    ))}
                  </j-flex>
                )}
                <j-text size="500" nomargin>
                  {percentage}%
                </j-text>
              </j-flex>

              {voteType === "weighted-choice" ? (
                <j-flex gap="400" a="center">
                  <input
                    className={styles.slider}
                    type="range"
                    min="0"
                    max="100"
                    value={points}
                    onChange={(e) => {
                      slidingRef.current = true;
                      pointsRef.current = +e.target.value;
                      setPoints(+e.target.value);
                    }}
                  />
                  <j-input
                    className={styles.input}
                    value={points.toString()}
                    onInput={(e: any) => {
                      pointsRef.current = +e.target.value;
                      setPoints(+e.target.value);
                      vote(id, +e.target.value);
                    }}
                  />
                </j-flex>
              ) : (
                <j-checkbox onChange={() => vote(id)} checked={hasVoted} size="sm">
                  <j-icon slot="checkmark" size="xs" name="check" />
                </j-checkbox>
              )}
            </>
          )}
        </j-flex>
      </j-flex>

      <j-text size="500" nomargin>
        {text}
      </j-text>
    </j-flex>
  );
}
