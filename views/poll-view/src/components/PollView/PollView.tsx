import { AgentClient } from "@coasys/ad4m";
import { useAd4mModel } from "@coasys/flux-utils/src/useAd4mModel";
import { useEffect, useState } from "preact/hooks";
import Poll from "../../models/Poll";
import Answer from "../../models/Answer";
import Vote from "../../models/Vote";
import NewPollModal from "../NewPollModal";
import PollCard from "../PollCard";

type Props = {
  agent: AgentClient;
  perspective: any;
  source: string;
};

export default function PollView({ perspective, source, agent }: Props) {
  const [myDid, setMyDid] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { entries: polls } = useAd4mModel({ perspective, model: Poll, query: { source } });

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
          />
        ))}
      </j-flex>
    </j-flex>
  );
}
