import { useLiveQuery } from '@coasys/ad4m-react-hooks';
import { Profile } from '@coasys/flux-types';
import * as d3 from 'd3';
import { useEffect, useMemo, useState } from 'preact/hooks';
import Answer from '../../models/Answer';
import Poll from '../../models/Poll';
import Vote from '../../models/Vote';
import AnswerCard from '../AnswerCard';
import Avatar from '../Avatar';
import PieChart from '../PieChart';
import styles from './PollCard.module.scss';

// todo:
// + set up adding new answers
// + set up vote data modal

export default function PollCard(props: {
  perspective: any;
  myDid: string;
  poll: any;
  deletePoll: (id: string) => void;
  getProfile: (did: string) => Promise<Profile>;
}) {
  const { perspective, myDid, poll, deletePoll, getProfile } = props;
  const { author, timestamp, voteType } = poll;
  const [processedAnswers, setProcessedAnswers] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const { data: answers } = useLiveQuery(Answer, perspective, {
    parent: { model: Poll, id: poll.id },
    query: { include: { votes: true } },
  });

  const colorScale = useMemo(() => {
    return d3.scaleSequential().domain([0, answers.length]).interpolator(d3.interpolateViridis);
  }, [answers]);

  function findPercentage(answer) {
    let percent = 0;
    if (voteType === 'weighted-choice') percent = totalPoints ? (100 / totalPoints) * answer.totalPoints : 0;
    else percent = totalVotes ? (100 / totalVotes) * answer.totalVotes : 0;
    return +percent.toFixed(1);
  }

  async function buildAnswerData() {
    console.debug('[PollCard.buildAnswerData] called with', answers.length, 'answers');
    let newTotalVotes = 0;
    let newTotalPoints = 0;
    const users = [];
    const newAnswers = answers.map((answer) => {
      const votes = answer.votes || [];
      console.debug(`[PollCard.buildAnswerData]   answer ${answer.id}: ${votes.length} votes`, votes.map((v: any) => ({ id: v.id, author: v.author, score: v.score })));
      const previousVote = votes.find((vote: any) => vote.author === myDid) as any;
      newTotalVotes += votes.length;
      let totalAnswerPoints = 0;
      if (voteType === 'weighted-choice') {
        totalAnswerPoints = votes.map((vote) => vote.score).reduce((a, b) => a + b, 0);
        newTotalPoints += totalAnswerPoints;
      }
      users.push(...votes.map((v: any) => v.author));
      return {
        id: answer.id,
        text: answer.text,
        author: answer.author,
        timestamp: answer.timestamp,
        totalVotes: votes.length,
        totalPoints: totalAnswerPoints,
        myPoints: previousVote?.score || 0,
      };
    }) as any;
    if (voteType === 'weighted-choice') newAnswers.sort((a, b) => b.totalPoints - a.totalPoints);
    else newAnswers.sort((a, b) => b.totalVotes - a.totalVotes);
    setTotalVotes(newTotalVotes);
    setTotalPoints(newTotalPoints);
    setTotalUsers([...new Set(users)].length);
    setProcessedAnswers(newAnswers);
  }

  function removePreviousVotes() {
    console.debug('[PollCard.removePreviousVotes] scanning', answers.length, 'answers for votes by', myDid);
    return Promise.all(
      answers.map(async (answer) => {
        const votes = answer.votes || [];
        const previousVote = votes.find((vote: any) => vote.author === myDid) as any;
        if (previousVote) {
          console.debug('[PollCard.removePreviousVotes] deleting vote', previousVote.id, 'on answer', answer.id);
          await previousVote.delete();
        }
      }),
    );
  }

  async function createVote(answerId, score) {
    console.debug('[PollCard.createVote] answerId=', answerId, 'score=', score);
    await Vote.create(perspective, { score }, { parent: { model: Answer, id: answerId } });
    console.debug('[PollCard.createVote] done');
  }

  async function updateVote(voteId, score) {
    console.debug('[PollCard.updateVote] voteId=', voteId, 'score=', score);
    await Vote.update(perspective, voteId, { score });
  }

  async function vote(answerId: string, value?: number) {
    console.debug('[PollCard.vote] answerId=', answerId, 'value=', value, 'voteType=', voteType);
    const votes = await Vote.findAll(perspective, { parent: { model: Answer, id: answerId } });
    console.debug('[PollCard.vote] found', votes.length, 'votes for answer', answerId, votes.map((v: any) => ({ id: v.id, author: v.author })));
    const previousVote = votes.find((vote: any) => vote.author === myDid) as any;
    console.debug('[PollCard.vote] previousVote=', previousVote ? previousVote.id : 'none');
    if (voteType === 'single-choice') {
      if (previousVote) {
        console.debug('[PollCard.vote] single-choice: deleting existing vote on this answer');
        await previousVote.delete();
      } else {
        console.debug('[PollCard.vote] single-choice: removing all previous votes, then creating new');
        await removePreviousVotes();
        await createVote(answerId, 100);
      }
    } else if (voteType === 'multiple-choice') {
      previousVote ? await previousVote.delete() : await createVote(answerId, 100);
    } else if (voteType === 'weighted-choice') {
      previousVote ? await updateVote(previousVote.id, value) : await createVote(answerId, value);
    }
    console.debug('[PollCard.vote] done, calling buildAnswerData for immediate UI update');
    buildAnswerData();
  }

  const answerFingerprint = JSON.stringify(answers.map((a) => ({
    id: a.id,
    votes: (a.votes || []).map((v: any) => ({ id: v.id, author: v.author, score: v.score })),
  })));

  useEffect(() => {
    console.debug('[PollCard.useEffect] answerFingerprint changed, calling buildAnswerData');
    buildAnswerData();
  }, [answerFingerprint]);

  return (
    <j-box p="600" className={styles.poll}>
      <j-flex direction="column" gap="400">
        <j-flex j="between">
          <j-flex gap="300" a="center">
            <Avatar size="sm" did={author} getProfile={getProfile} showName />
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
              getProfile={getProfile}
            />
          ))}
        </j-flex>
      </j-flex>
    </j-box>
  );
}
