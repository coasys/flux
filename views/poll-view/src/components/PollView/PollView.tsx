import { AgentClient } from "@coasys/ad4m";
import { useSubjects } from "@coasys/ad4m-react-hooks";
import { useState } from "preact/hooks";
import Poll from "../../models/Poll";
import Vote from "../../models/Vote";
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
  const { repo: voteRepo } = useSubjects({ perspective, source, subject: Vote });

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

      <NewPollModal perspective={perspective} source={source} open={modalOpen} setOpen={setModalOpen} />

      <j-box pt="500">
        <j-flex gap="300" direction="column">
          {polls.map((poll, index) => (
            <PollCard perspective={perspective} poll={poll} index={index} deletePoll={deletePoll} vote={vote} />
          ))}
        </j-flex>
      </j-box>
    </div>
  );
}
