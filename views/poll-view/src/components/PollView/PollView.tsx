import { AgentClient } from "@coasys/ad4m";
import { useSubjects } from "@coasys/ad4m-react-hooks";
import { useState } from "preact/hooks";
import Poll from "../../models/Poll";
import NewPollModal from "../NewPollModal";
import PollCard from "../PollCard";

type Props = {
  perspective: any;
  source: string;
  agent: AgentClient;
};

export default function PollView({ perspective, source, agent }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const { entries: polls, repo: pollRepo } = useSubjects({ perspective, source, subject: Poll });

  function deletePoll(id: string) {
    pollRepo.remove(id).catch(console.log);
  }

  return (
    <j-flex gap="600" direction="column">
      <j-text size="600" weight="800" color="primary-500" uppercase nomargin>
        Polls
      </j-text>

      <j-button variant="primary" onClick={() => setModalOpen(true)}>
        New Poll
      </j-button>

      <NewPollModal perspective={perspective} source={source} open={modalOpen} setOpen={setModalOpen} />

      <j-flex gap="300" direction="column">
        {polls.map((poll, index) => (
          <PollCard perspective={perspective} agent={agent} poll={poll} index={index} deletePoll={deletePoll} />
        ))}
      </j-flex>
    </j-flex>
  );
}
