import { useEffect, useState } from "preact/hooks";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils.js";
import CommunityCard from "./CommunityCard";

export default function AllCommunities() {
  const { perspectives } = usePerspectives();

  return (
    <>
      <j-text variant="heading-lg">
        My communities ({perspectives.length})
      </j-text>
      <j-flex direction="column" gap="500">
        {perspectives.map((perspective: any) => (
          <CommunityCard uuid={perspective.uuid}></CommunityCard>
        ))}
      </j-flex>
    </>
  );
}

function usePerspectives() {
  const [perspectives, setPerspectives] = useState([]);

  async function fetchPerspectives() {
    const ad4m = await getAd4mClient();
    const perspectives = await ad4m.perspective.all();
    setPerspectives(perspectives);
  }

  useEffect(() => {
    fetchPerspectives();
  }, []);

  return { perspectives };
}
