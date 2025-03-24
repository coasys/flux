import * as d3 from "d3";
import { useRef, useState } from "preact/hooks";
import Answer from "../../models/Answer";
import Poll from "../../models/Poll";
import AnswerCard from "../AnswerCard";
import styles from "./NewPollModal.module.scss";

type Props = {
  perspective: any;
  source: string;
  myDid: string;
  close: () => void;
};

type VoteTypes = "single-choice" | "multiple-choice" | "weighted-choice";
const voteTypes = ["single-choice", "multiple-choice", "weighted-choice"] as VoteTypes[];

export default function PollView({ perspective, source, myDid, close }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [answers, setAnswers] = useState<any[]>([]);
  const [voteType, setVoteType] = useState<VoteTypes>(voteTypes[0]);
  const [answersLocked, setAnswersLocked] = useState(true);
  const [titleError, setTitleError] = useState("");
  const [answersError, setAnswersError] = useState("");
  const [loading, setLoading] = useState(false);
  const colorScale = useRef(d3.scaleSequential().domain([0, answers.length]).interpolator(d3.interpolateViridis));

  function addAnswer() {
    if (!newAnswer) setAnswersError("Required");
    else {
      setAnswersError("");
      const newAnswers = [...answers, { text: newAnswer }];
      colorScale.current = d3.scaleSequential().domain([0, newAnswers.length]).interpolator(d3.interpolateViridis);
      setAnswers(newAnswers);
      setNewAnswer("");
    }
  }

  function removeAnswer(index) {
    const newAnswers = [...answers];
    newAnswers.splice(index, 1);
    colorScale.current = d3.scaleSequential().domain([0, newAnswers.length]).interpolator(d3.interpolateViridis);
    setAnswers(newAnswers);
  }

  async function createPoll() {
    setTitleError(title ? "" : "Required");
    const answersValid = !answersLocked || answers.length > 1;
    setAnswersError(answersValid ? "" : "At least 2 answers required for locked polls");
    if (title && answersValid) {
      setLoading(true);
      const newPoll = new Poll(perspective, undefined, source);
      newPoll.title = title;
      newPoll.description = description;
      newPoll.voteType = voteType;
      newPoll.answersLocked = answersLocked;
      await newPoll.save();

      Promise.all(
        answers.map((answer) => {
          const newAnswer = new Answer(perspective, undefined, newPoll.baseExpression);
          newAnswer.text = answer.text;
          return newAnswer.save();
        })
      )
        .then(() => close())
        .catch(console.log);
    }
  }

  return (
    // @ts-ignore
    <j-modal open onToggle={(e) => !e.target.open && close()}>
      <j-box m="700">
        <j-flex direction="column" gap="600" a="center">
          <j-text variant="heading-lg">New poll</j-text>

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

            <j-flex gap="500">
              <j-input
                label="Answers"
                value={newAnswer}
                onChange={(e) => setNewAnswer((e.target as HTMLTextAreaElement).value)}
                errortext={answersError}
                error={!!answersError}
                style={{ width: "100%" }}
              />
              <j-button onClick={addAnswer} style={{ marginTop: 26 }}>
                Add Answer
              </j-button>
            </j-flex>

            {answers.map((answer, index) => (
              <AnswerCard
                perspective={perspective}
                myDid={myDid}
                answer={answer}
                index={index}
                color={colorScale.current(index)}
                removeAnswer={removeAnswer}
                preview
              />
            ))}

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

          <j-button variant="primary" onClick={createPoll} loading={loading} disabled={loading}>
            Create Poll
          </j-button>
        </j-flex>
      </j-box>
    </j-modal>
  );
}
