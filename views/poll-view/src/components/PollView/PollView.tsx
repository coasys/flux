import { AgentClient } from "@coasys/ad4m";
import { useSubjects } from "@coasys/ad4m-react-hooks";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "preact/hooks";
import Answer from "../../models/Answer";
import Poll from "../../models/Poll";
import Vote from "../../models/Vote";
import AnswerCard from "../AnswerCard";
import PollCard from "../PollCard";

type Props = {
  perspective: any;
  source: string;
  agent: AgentClient;
};

export default function PollView({ perspective, source, agent }: Props) {
  const { entries: polls, repo: pollRepo } = useSubjects({
    perspective,
    source,
    subject: Poll,
  });

  // answer repo used to create answers
  const { repo: answerRepo } = useSubjects({
    perspective,
    source,
    subject: Answer,
  });

  // vote repo used to create and remove votes
  const { repo: voteRepo } = useSubjects({
    perspective,
    source,
    subject: Vote,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answersLocked, setAnswersLocked] = useState(true);
  const [newAnswer, setNewAnswer] = useState("");
  const [answers, setAnswers] = useState<any[]>([]);
  const [titleError, setTitleError] = useState("");
  const [answersError, setAnswersError] = useState("");
  const [newPollLoading, setNewPollLoading] = useState(false);
  const colorScale = useRef(
    d3.scaleSequential().domain([0, answers.length]).interpolator(d3.interpolateViridis)
  );

  function addAnswer() {
    if (!newAnswer) setAnswersError("Required");
    else {
      setAnswersError("");
      const newAnswers = [...answers, { text: newAnswer }];
      colorScale.current = d3
        .scaleSequential()
        .domain([0, newAnswers.length])
        .interpolator(d3.interpolateViridis);
      setAnswers(newAnswers);
      setNewAnswer("");
    }
  }

  function removeAnswer(index) {
    const newAnswers = [...answers];
    newAnswers.splice(index, 1);
    colorScale.current = d3
      .scaleSequential()
      .domain([0, newAnswers.length])
      .interpolator(d3.interpolateViridis);
    setAnswers(newAnswers);
  }

  async function createPoll() {
    // validate
    setTitleError(title ? "" : "Required");
    const answersValid = !answersLocked || answers.length > 1;
    setAnswersError(answersValid ? "" : "At least 2 answers required for locked polls");
    if (title && answersValid) {
      setNewPollLoading(true);
      // create poll
      // @ts-ignore
      const poll = await pollRepo.create({
        title,
        description,
        answersLocked,
      });
      // create answers
      Promise.all(
        answers.map((answer) =>
          answerRepo
            // @ts-ignore
            .create({ text: answer.text })
            .then((expression) =>
              perspective.add({
                // @ts-ignore
                source: poll.id,
                predicate: "flux://has_poll_answer",
                // @ts-ignore
                target: expression.id,
              })
            )
        )
      )
        .then(() => {
          setNewPollLoading(false);
          setTitle("");
          setDescription("");
          setAnswersLocked(true);
          setAnswers([]);
          setModalOpen(false);
        })
        .catch((error) => console.log("poll creation error: ", error));
    }
  }

  // function toggleTodo({ id, done }) {
  //   repo.update(id, { done }).catch(console.log);
  // }

  function deletePoll(id: string) {
    pollRepo.remove(id).catch(console.log);
  }

  // can be moved down to answer component
  function vote(answerId: string, voteId: string) {
    return new Promise((resolve: any) => {
      console.log("vote!: ", answerId, voteId);
      if (voteId) {
        // remove vote
        pollRepo
          .remove(voteId)
          .then(() => resolve("vote removed"))
          .catch((error) => resolve(error));
      } else {
        // add vote
        // const expression = await
        voteRepo
          // @ts-ignore
          .create({ value: null })
          .then((expression) =>
            perspective
              .add({
                source: answerId,
                predicate: "flux://has_answer_vote",
                // @ts-ignore
                target: expression.id,
              })
              .then(() => resolve("vote added"))
              .catch((error) => resolve(error))
          );
      }
    });
  }

  // update modalOpen state when modal toggled shut
  useEffect(() => {
    const modal = document.querySelector("j-modal");
    modal.addEventListener("toggle", (e) => {
      if (!(e.target as any).open) setModalOpen(false);
    });
  }, []);

  useEffect(() => {
    console.log("polls: ", polls);
  }, [polls]);

  useEffect(() => {
    console.log("source: ", source);
  }, [source]);

  return (
    <div>
      <j-box pt="900" pb="400">
        <j-text uppercase size="300" weight="800" color="primary-500">
          Polls
        </j-text>
      </j-box>

      <j-button variant="primary" onClick={() => setModalOpen(true)}>
        New Poll
      </j-button>

      <j-modal open={modalOpen}>
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
            ></j-input>
          </j-box>

          <j-box pb="400">
            <j-input
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
            ></j-input>
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
              ></j-input>
              <j-button onClick={addAnswer} style={{ marginTop: 26 }}>
                Add Answer
              </j-button>
              {/* <j-button square>
              <j-icon name="plus"></j-icon>
            </j-button> */}
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

          <j-button
            variant="primary"
            onClick={createPoll}
            loading={newPollLoading}
            disabled={newPollLoading}
          >
            Create Poll
          </j-button>
        </j-box>
      </j-modal>

      <j-box pt="500">
        <j-flex gap="300" direction="column">
          {polls.map((poll, index) => (
            <PollCard
              perspective={perspective}
              poll={poll}
              index={index}
              deletePoll={deletePoll}
              vote={vote}
            />
          ))}
        </j-flex>
      </j-box>
    </div>
  );
}
