import { useSubjects } from "@coasys/ad4m-react-hooks";
import { SubjectRepository } from "@coasys/flux-api";
import * as d3 from "d3";
import { useEffect, useMemo, useState } from "preact/hooks";
import Answer from "../../models/Answer";
import Vote from "../../models/Vote";
import AnswerCard from "../AnswerCard";
import PieChart from "../PieChart";
import styles from "./PollCard.module.scss";

export default function PollCard(props: {
  perspective: any;
  agent: any;
  poll: any;
  index: number;
  deletePoll: (id: string) => void;
}) {
  const { agent, perspective, poll, index, deletePoll } = props;
  const [totalVotes, setTotalVotes] = useState(0);
  const [answersWithStats, setAnswersWithStats] = useState([]);
  const [renderKey, setRenderKey] = useState(0);

  const { entries: answers } = useSubjects({ perspective, source: poll.id, subject: Answer });

  const colorScale = useMemo(() => {
    return d3.scaleSequential().domain([0, answers.length]).interpolator(d3.interpolateViridis);
  }, [answers]);

  async function buildAnswerData() {
    let totalVotes = 0;
    const newAnswers = await Promise.all(
      answers.map(
        (answer, i) =>
          new Promise(async (resolve) => {
            const votes = await new SubjectRepository(Vote, { perspective, source: answer.id }).getAllData();
            totalVotes += votes.length;
            resolve({ ...answer, index: i, color: colorScale(i), totalVotes: votes.length });
          })
      )
    );
    setTotalVotes(totalVotes);
    setAnswersWithStats(
      await newAnswers
        .map((answer: any) => {
          return { ...answer, percentage: parseFloat(((100 / totalVotes) * answer.totalVotes).toFixed(2)) };
        })
        .sort((a, b) => b.percentage - a.percentage)
    );
  }

  useEffect(() => {
    buildAnswerData();
  }, [JSON.stringify(answers), renderKey]);

  return (
    <j-box p="600" className={styles.poll}>
      <j-flex direction="column">
        <j-text variant="heading-sm">{poll.title}</j-text>
        <j-text size="500">{poll.description}</j-text>
        <j-flex direction="row" j="center">
          <PieChart
            type="multiple-choice"
            pollId={poll.id}
            totalVotes={totalVotes}
            totalPoints={0}
            totalUsers={3}
            answers={answersWithStats}
          />
        </j-flex>
        <j-flex gap="400" direction="column">
          {answersWithStats.map((answer) => (
            <AnswerCard
              agent={agent}
              perspective={perspective}
              answer={answer}
              rerender={() => setRenderKey((prev) => prev + 1)}
            />
          ))}
        </j-flex>
      </j-flex>
      <j-button onClick={() => deletePoll(poll.id)}>Delete</j-button>
    </j-box>
  );
}
