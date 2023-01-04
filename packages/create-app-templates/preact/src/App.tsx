import { useEffect, useState } from "preact/hooks";
import ChannelModel, { Channel } from "utils/api/channel";
import MemberModel, { Member } from "utils/api/member";
import CommunityModel, { Community } from "utils/api/community";
import useEntries from "utils/react/useEntries";

import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

function usePerspectives() {
  const [perspectives, setPerspectives] = useState([]);

  async function fetchPerspectives() {
    const ad4m = await getAd4mClient();
    const perspectives = await ad4m.perspective.all();
    const pers = perspectives.map((p) =>
      new CommunityModel({ perspectiveUuid: p.uuid }).get()
    );
    const communities = await Promise.all(pers);
    setPerspectives(communities);
  }

  useEffect(() => {
    fetchPerspectives();
  }, []);

  return { perspectives };
}

export default function App({ perspective, source }) {
  const { perspectives } = usePerspectives();

  const { entries: channels } = useEntries({
    perspectiveUuid: perspective,
    model: ChannelModel,
  });

  const { entries: members } = useEntries({
    perspectiveUuid: perspective,
    model: MemberModel,
  });

  console.log(perspectives);

  if (!perspective) {
    return (
      <j-box>
        <j-text variant="heading">Select a perspective</j-text>
        <j-flex direction="column" gap="500">
          {perspectives.map((perspective: any) => (
            <j-box p="500" bg="ui-100" r="md">
              <j-text variant="heading">{perspective.name}</j-text>
            </j-box>
          ))}
        </j-flex>
        <j-text>
          Try to load a perspective by pasting a perspective uuid into the url
        </j-text>
      </j-box>
    );
  }

  return (
    <h1>
      This perspective has:
      <j-flex direction="column" gap="500">
        {channels.map((channel: Channel) => (
          <j-box p="500" bg="ui-100" r="md">
            <j-text variant="heading">{channel.name}</j-text>
          </j-box>
        ))}
      </j-flex>
      <j-flex direction="column" gap="500">
        {members.map((member: Member) => (
          <j-box p="500" bg="ui-100" r="md">
            <j-text variant="heading">{member.did}</j-text>
          </j-box>
        ))}
      </j-flex>
    </h1>
  );
}
