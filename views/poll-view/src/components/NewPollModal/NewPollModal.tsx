import { useSubjects } from "@coasys/ad4m-react-hooks";
import * as d3 from "d3";
import { useRef, useState } from "preact/hooks";
import Answer from "../../models/Answer";
import Poll from "../../models/Poll";
import AnswerCard from "../AnswerCard";

type Props = {
  perspective: any;
  source: string;
  open: boolean;
  setOpen: (state: boolean) => void;
};

export default function PollView({ perspective, source, open, setOpen }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answersLocked, setAnswersLocked] = useState(true);
  const [newAnswer, setNewAnswer] = useState("");
  const [answers, setAnswers] = useState<any[]>([]);
  const [titleError, setTitleError] = useState("");
  const [answersError, setAnswersError] = useState("");
  const [loading, setLoading] = useState(false);

  const colorScale = useRef(d3.scaleSequential().domain([0, answers.length]).interpolator(d3.interpolateViridis));

  const { repo: pollRepo } = useSubjects({ perspective, source, subject: Poll });
  const { repo: answerRepo } = useSubjects({ perspective, source, subject: Answer });

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
    // validate poll
    setTitleError(title ? "" : "Required");
    const answersValid = !answersLocked || answers.length > 1;
    setAnswersError(answersValid ? "" : "At least 2 answers required for locked polls");
    if (title && answersValid) {
      // create poll
      setLoading(true);
      // @ts-ignore
      const poll = await pollRepo.create({ title, description, answersLocked });
      // create answers
      Promise.all(
        answers.map((answer) =>
          answerRepo
            // @ts-ignore
            .create({ text: answer.text })
            .then((expression) =>
              // @ts-ignore
              perspective.add({ source: poll.id, predicate: "flux://has_poll_answer", target: expression.id })
            )
        )
      )
        .then(() => {
          console.log("answers created!");
          setOpen(false);
        })
        .catch((error) => console.log("poll creation error: ", error));
    }
  }

  return (
    <j-modal open={open} onToggle={(e) => setOpen(e.target.open)}>
      <j-box p="500">
        <j-box pb="500">
          <j-text variant="heading-sm">New poll</j-text>
        </j-box>

        <j-box pb="600">
          <j-input
            label="Title"
            value={title}
            onChange={(e) => setTitle((e.target as HTMLTextAreaElement).value)}
            errortext={titleError}
            error={!!titleError}
          />
        </j-box>

        <j-box pb="400">
          <j-input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
          />
        </j-box>

        <j-box pb="400">
          <j-toggle checked={!answersLocked} onChange={() => setAnswersLocked(!answersLocked)}>
            Allow other users to add answers
          </j-toggle>
        </j-box>

        <j-box pb="600">
          <j-flex gap="500">
            <j-input
              label="New Answer"
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
        </j-box>

        <j-box pb="600">
          {answers.map((answer, index) => (
            <AnswerCard
              perspective={perspective}
              answer={answer}
              index={index}
              color={colorScale.current(index)}
              removeAnswer={removeAnswer}
            />
          ))}
        </j-box>

        <j-button variant="primary" onClick={createPoll} loading={loading} disabled={loading}>
          Create Poll
        </j-button>
      </j-box>
    </j-modal>
  );
}
