import { useSubjects } from "@coasys/ad4m-react-hooks";
import * as d3 from "d3";
import { useMemo, useRef, useState } from "preact/hooks";
import styles from "../Plugin.module.css";
import Answer from "../subjects/Answer";
import AnswerCard from "./AnswerCard";
import PieChart from "./PieChart";

export default function PollCard(props: {
  perspective: any;
  poll: any;
  index: number;
  deletePoll: (id: string) => void;
  vote?: (answerId: string, voteId: string) => Promise<any>;
}) {
  const { perspective, poll, index, deletePoll, vote } = props;

  const { entries: answers } = useSubjects({
    perspective,
    source: poll.id,
    subject: Answer,
  });

  const [totalVotes, setTotalVotes] = useState(0);

  const colorScale = useRef(
    d3.scaleSequential().domain([0, poll.answers.length]).interpolator(d3.interpolateViridis)
  );

  const answersData = useMemo(() => {
    return answers.map((answer) => {
      return { ...answer, totalVotes: Math.floor(Math.random() * 6) };
    });
  }, [answers]);

  // todo: need to be able to collate all data from answers and votes
  // useEffect(() => {
  //   // build visualisation data
  //   // count votes for each answer
  //   console.log("useffect");
  //   // console.log("answers: ", answers);
  //   setTotalVotes(20);
  //   // const newAnswers = [...answers];
  //   // setAnswersData(newAnswers);
  //   // setAnswersData(
  //   //   answers.map((a) => {
  //   //     return { ...a, totalVotes: Math.floor(Math.random() * 3) };
  //   //   })
  //   // );
  //   // Promise.all(
  //   //   answers.map(
  //   //     (answer) =>
  //   //       new Promise((resolve) => {
  //   //         // const { entries: votes } = useSubjects({
  //   //         //   perspective,
  //   //         //   source: poll.id,
  //   //         //   subject: Vote,
  //   //         // });
  //   //         resolve({ ...answer, totalVotes: Math.floor(Math.random() * 3) });
  //   //       })
  //   //   )
  //   // )
  //   //   .then((data) => {
  //   //     setTotalVotes(
  //   //       data.map((a: any) => a.totalVotes).reduce((a, b) => a + b, 0)
  //   //     );
  //   //     setAnswersData(data);
  //   //   })
  //   //   .catch((error) => console.log(error));
  // }, [answers]);

  return (
    <j-box p="600" className={styles.poll}>
      <j-flex direction="column">
        <j-text variant="heading-sm">{poll.title}</j-text>
        <j-text size="500">{poll.description}</j-text>
        <j-flex direction="row" j="center">
          <PieChart
            type="multiple-choice"
            pollId={poll.id}
            totalVotes={10}
            totalPoints={0}
            totalUsers={3}
            answers={answersData}
          />
        </j-flex>
        <j-flex gap="300" direction="column">
          {answers.map((answer, index) => (
            <AnswerCard
              perspective={perspective}
              answer={answer}
              index={index}
              color={colorScale.current(index)}
              vote={vote}
            />
          ))}
        </j-flex>
      </j-flex>
      <j-button onClick={() => deletePoll(poll.id)}>Delete</j-button>
    </j-box>
  );
}
