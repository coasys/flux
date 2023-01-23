import { useEffect, useState } from "preact/hooks";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient, PerspectiveProxy } from "@perspect3vism/ad4m";

export default function AllCommunities() {
  const { neighbourhoods } = useNeighbourhoods();

  return (
    <>
      <j-text variant="heading-lg">
        My neighbourhoods ({neighbourhoods.length})
      </j-text>
      <j-flex direction="column" gap="500">
        {neighbourhoods.map((n) => (
          <div>{n.sharedUrl}</div>
        ))}
      </j-flex>
    </>
  );
}

function useNeighbourhoods() {
  const [neighbourhoods, setNeighbourhoods] = useState<PerspectiveProxy[]>([]);

  async function fetchneighbourhoods() {
    const ad4m: Ad4mClient = await getAd4mClient();
    const perspectives = await ad4m.perspective.all();
    const neighbourhoods = perspectives.filter((p) => p.sharedUrl);
    setNeighbourhoods(neighbourhoods);
  }

  useEffect(() => {
    fetchneighbourhoods();
  }, []);

  return { neighbourhoods };
}
