import { AgentClient } from "@coasys/ad4m";
import { useSubjects } from "@coasys/ad4m-react-hooks";
import { useEffect, useState } from "preact/hooks";
import Poll from "../../models/Poll";
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
  const { entries: polls, repo: pollRepo } = useSubjects({ perspective, source, subject: Poll });

  function deletePoll(id: string) {
    pollRepo.remove(id).catch(console.log);
  }

  useEffect(() => {
    agent.me().then((data) => setMyDid(data.did));
  }, []);

  return (
    <j-flex gap="600" direction="column">
      <j-text size="600" weight="800" color="primary-500" uppercase nomargin>
        Polls
      </j-text>

      <j-button variant="primary" onClick={() => setModalOpen(true)}>
        New Poll
      </j-button>

      <NewPollModal perspective={perspective} source={source} myDid={myDid} open={modalOpen} setOpen={setModalOpen} />

      <j-flex gap="500" direction="column">
        {polls.map((poll) => (
          <PollCard key={poll.id} perspective={perspective} myDid={myDid} poll={poll} deletePoll={deletePoll} />
        ))}
      </j-flex>
    </j-flex>
  );
}
