import { useSubjects } from "@coasys/ad4m-react-hooks";
import { SubjectRepository } from "@coasys/flux-api";
import * as d3 from "d3";
import { useEffect, useMemo, useState } from "preact/hooks";
import Answer from "../../models/Answer";
import Vote from "../../models/Vote";
import AnswerCard from "../AnswerCard";
import Avatar from "../Avatar";
import PieChart from "../PieChart";
import styles from "./PollCard.module.scss";

// todo:
// + set up adding new answers
// + set up vote data modal

export default function PollCard(props: {
  perspective: any;
  myDid: string;
  poll: any;
  deletePoll: (id: string) => void;
}) {
  const { perspective, myDid, poll, deletePoll } = props;
  const { author, timestamp, voteType } = poll;
  const [processedAnswers, setProcessedAnswers] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const { entries: answers } = useSubjects({ perspective, source: poll.id, subject: Answer });

  const colorScale = useMemo(() => {
    return d3.scaleSequential().domain([0, answers.length]).interpolator(d3.interpolateViridis);
  }, [answers]);

  function findPercentage(answer) {
    let percent = 0;
    if (voteType === "weighted-choice") percent = totalPoints ? (100 / totalPoints) * answer.totalPoints : 0;
    else percent = totalVotes ? (100 / totalVotes) * answer.totalVotes : 0;
    return +percent.toFixed(1);
  }

  async function buildAnswerData() {
    let newTotalVotes = 0;
    let newTotalPoints = 0;
    const users = [];
    const newAnswers = (await Promise.all(
      answers.map(
        (answer) =>
          new Promise(async (resolve) => {
            const votes = await new SubjectRepository(Vote, { perspective, source: answer.id }).getAllData();
            const previousVote = votes.find((vote: any) => vote.author === myDid) as any;
            newTotalVotes += votes.length;
            let totalAnswerPoints = 0;
            if (voteType === "weighted-choice") {
              totalAnswerPoints = votes.map((vote) => vote.score).reduce((a, b) => a + b, 0);
              newTotalPoints += totalAnswerPoints;
            }
            users.push(...votes.map((v: any) => v.author));
            resolve({
              ...answer,
              totalVotes: votes.length,
              totalPoints: totalAnswerPoints,
              myPoints: previousVote?.score || 0,
            });
          })
      )
    )) as any;
    if (voteType === "weighted-choice") newAnswers.sort((a, b) => b.totalPoints - a.totalPoints);
    else newAnswers.sort((a, b) => b.totalVotes - a.totalVotes);
    setTotalVotes(newTotalVotes);
    setTotalPoints(newTotalPoints);
    setTotalUsers([...new Set(users)].length);
    setProcessedAnswers(newAnswers);
  }

  function removePreviousVotes() {
    return Promise.all(
      answers.map(async (answer) => {
        const voteRepo = await new SubjectRepository(Vote, { perspective, source: answer.id });
        const votes = await voteRepo.getAllData();
        const previousVote = votes.find((vote: any) => vote.author === myDid) as any;
        if (previousVote) await voteRepo.remove(previousVote.id);
      })
    );
  }

  async function vote(answerId: string, value?: number) {
    const voteRepo = await new SubjectRepository(Vote, { perspective, source: answerId });
    const votes = await voteRepo.getAllData();
    const previousVote = votes.find((vote: any) => vote.author === myDid) as any;
    let task;
    if (voteType === "single-choice") {
      task = previousVote
        ? voteRepo.remove(previousVote.id)
        : // @ts-ignore
          removePreviousVotes().then(() => voteRepo.create({ score: 100 }));
    } else if (voteType === "multiple-choice") {
      // @ts-ignore
      task = previousVote ? voteRepo.remove(previousVote.id) : voteRepo.create({ score: 100 });
    } else if (voteType === "weighted-choice") {
      // @ts-ignore
      task = previousVote ? voteRepo.update(previousVote.id, { score: value }) : voteRepo.create({ score: value });
    }
    await task;
    buildAnswerData();
  }

  useEffect(() => {
    buildAnswerData();
  }, [JSON.stringify(answers)]);

  return (
    <j-box p="600" className={styles.poll}>
      <j-flex direction="column" gap="400">
        <j-flex j="between">
          <j-flex gap="300" a="center">
            <Avatar size="sm" did={author} showName />
            <j-text nomargin>|</j-text>
            <j-text nomargin>
              <j-timestamp value={timestamp} relative />
            </j-text>
          </j-flex>
          {myDid === author && (
            <j-button square>
              <j-icon name="trash" onClick={() => deletePoll(poll.id)} />
            </j-button>
          )}
        </j-flex>
        <j-text variant="heading-sm" nomargin>
          {poll.title}
        </j-text>
        <j-text size="500" nomargin>
          {poll.description}
        </j-text>
        <j-flex j="center">
          <PieChart
            pollId={poll.id}
            type={voteType}
            totalVotes={totalVotes}
            totalPoints={totalPoints}
            totalUsers={totalUsers}
            answers={processedAnswers}
          />
        </j-flex>
        <j-flex j="between" a="center">
          <j-flex gap="300" a="center">
            <j-icon name="pie-chart" />
            <j-text nomargin>Vote type:</j-text>
            <j-text nomargin>
              <b>{voteType}</b>
            </j-text>
          </j-flex>
        </j-flex>
        <j-flex gap="400" direction="column">
          {processedAnswers.map((answer, i) => (
            <AnswerCard
              key={answer.id}
              perspective={perspective}
              myDid={myDid}
              answer={answer}
              index={i}
              color={colorScale(i)}
              percentage={findPercentage(answer)}
              voteType={voteType}
              vote={vote}
            />
          ))}
        </j-flex>
      </j-flex>
    </j-box>
  );
}
