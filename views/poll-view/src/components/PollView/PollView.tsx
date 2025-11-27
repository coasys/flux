import { AgentClient, PerspectiveProxy } from '@coasys/ad4m';
import { useModel } from '@coasys/ad4m-react-hooks';
import { Profile } from '@coasys/flux-types';
import { useEffect, useState } from 'preact/hooks';
import Answer from '../../models/Answer';
import Poll from '../../models/Poll';
import Vote from '../../models/Vote';
import NewPollModal from '../NewPollModal';
import PollCard from '../PollCard';

type Props = {
  agent: AgentClient;
  perspective: PerspectiveProxy;
  source: string;
  getProfile: (did: string) => Promise<Profile>;
};

export default function PollView({ perspective, source, agent, getProfile }: Props) {
  const [myDid, setMyDid] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { entries: polls } = useModel({ perspective, model: Poll, query: { source } });

  async function deletePoll(id: string) {
    const poll = new Poll(perspective, id, source);
    await poll.delete();
  }

  async function ensureSDNAClasses() {
    // Ensure all SDNA classes are loaded into the perspective
    await Promise.all([
      perspective.ensureSDNASubjectClass(Poll),
      perspective.ensureSDNASubjectClass(Answer),
      perspective.ensureSDNASubjectClass(Vote),
    ]);
  }

  async function getMyDid() {
    // Store user DID for use throughout the view
    const me = await agent.me();
    setMyDid(me.did);
  }

  useEffect(() => {
    ensureSDNAClasses();
    getMyDid();
  }, []);

  return (
    <j-flex gap="600" direction="column">
      <j-text size="600" weight="800" color="primary-500" uppercase nomargin>
        Polls
      </j-text>

      <j-button variant="primary" onClick={() => setModalOpen(true)}>
        New Poll
      </j-button>

      {modalOpen && (
        <NewPollModal perspective={perspective} source={source} myDid={myDid} close={() => setModalOpen(false)} />
      )}

      <j-flex gap="500" direction="column">
        {polls.map((poll) => (
          <PollCard
            key={poll.baseExpression}
            perspective={perspective}
            myDid={myDid}
            poll={poll}
            deletePoll={deletePoll}
            getProfile={getProfile}
          />
        ))}
      </j-flex>
    </j-flex>
  );
}
