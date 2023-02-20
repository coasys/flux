import { useState, useEffect } from "preact/hooks";

import { Profile } from "utils/types";
import getProfile from "utils/api/getProfile";

type Props = {
  userId: string;
  onClick: () => void;
};

export default function DebugItem({ userId, onClick }: Props) {
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
    <j-button onClick={onClick}>
      Send signal to {profile?.username || userId}
    </j-button>
  );
}
