import { useAd4mModel } from "@coasys/flux-utils/src/useAd4mModel";
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

  const { entries: answers } = useAd4mModel({ perspective, model: Answer, query: { source: poll.baseExpression } });

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
            const votes = await Vote.findAll(perspective, { source: answer.baseExpression });
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
              baseExpression: answer.baseExpression,
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
        const votes = await Vote.findAll(perspective, { source: answer.baseExpression });
        const previousVote = votes.find((vote: any) => vote.author === myDid) as any;
        if (previousVote) {
          const vote = new Vote(perspective, previousVote.baseExpression);
          await vote.delete();
        }
      })
    );
  }

  async function createVote(source, score) {
    const newVote = new Vote(perspective, undefined, source);
    newVote.score = score;
    await newVote.save();
  }

  async function updateVote(id, score) {
    const vote = new Vote(perspective, id);
    vote.score = score;
    await vote.update();
  }

  async function vote(answerId: string, value?: number) {
    const votes = await Vote.findAll(perspective, { source: answerId });
    const previousVote = votes.find((vote: any) => vote.author === myDid) as any;
    if (voteType === "single-choice") {
      previousVote ? await previousVote.delete() : await removePreviousVotes().then(() => createVote(answerId, 100));
    } else if (voteType === "multiple-choice") {
      previousVote ? await previousVote.delete() : await createVote(answerId, 100);
    } else if (voteType === "weighted-choice") {
      previousVote ? await updateVote(previousVote.baseExpression, value) : await createVote(answerId, value);
    }
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
              <j-icon name="trash" onClick={() => deletePoll(poll.baseExpression)} />
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
            pollId={poll.baseExpression}
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
              key={answer.baseExpression}
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
