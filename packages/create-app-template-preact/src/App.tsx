import ChannelModel, { Channel } from "utils/api/channel";
import MemberModel, { Member } from "utils/api/member";
import useEntries from "utils/react/useEntries";

export default function App({ perspective, source }) {
  const { entries: channels } = useEntries({
    perspectiveUuid: perspective,
    model: ChannelModel,
  });

  const { entries: members } = useEntries({
    perspectiveUuid: perspective,
    source,
    model: MemberModel,
  });

  return (
    <h1>
      This perspective has:
      <ul>
        {channels.map((channel: Channel) => (
          <li>{channel.name}</li>
        ))}
      </ul>
      <ul>
        {members.map((member: Member) => (
          <li>{member.did}</li>
        ))}
      </ul>
    </h1>
  );
}
