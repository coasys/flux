import { useState, useEffect } from "preact/hooks";

import { Profile } from "utils/types";
import { getProfile } from "utils/api";

type Props = {
  userId: string;
  isSelf?: boolean;
  disabled: boolean;
  onClick: () => void;
};

export default function DebugItem({
  userId,
  isSelf,
  disabled,
  onClick,
}: Props) {
  const [profile, setProfile] = useState<Profile>();

  // Get user details
  useEffect(() => {
    async function fetchAgent() {
      const profileResponse = await getProfile(userId);
      setProfile(profileResponse);
    }

    if (!profile) {
      fetchAgent();
    }
  }, [profile, userId]);

  return (
    <j-button onClick={onClick} disabled={disabled}>
      Send signal to {isSelf ? "myself" : profile?.username || userId}
    </j-button>
  );
}
