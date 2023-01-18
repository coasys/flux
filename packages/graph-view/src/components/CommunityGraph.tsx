import ForceGraph3D from "3d-force-graph";
import { useEffect } from "preact/hooks";
import ChannelModel, { Channel } from "utils/api/channel";
import CommunityModel, { Community } from "utils/api/community";
import MemberModel, { Member } from "utils/api/member";
import useEntries from "utils/react/useEntries";
import useEntry from "utils/react/useEntry";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient } from "@perspect3vism/ad4m";
import styles from "../App.module.css";

export default function CommunityOverview({ uuid }) {
  useEffect(() => {
    const fetchsnapshot = async () => {
      const client: Ad4mClient = await getAd4mClient();
      const snapshot = await client.perspective.snapshotByUUID(uuid);
      console.log(snapshot);

      const N = 300;
      const gData = {
        nodes: snapshot.links.map((l) => ({ id: l.data.target })),
        links: snapshot.links.map((l) => ({
          source: l.data.target,
          target: l.data.predicate,
        })),
      };

      const myGraph = ForceGraph3D();
      myGraph(document.getElementById("graph")).graphData(gData);
    };

    if (uuid) {
      fetchsnapshot();
    }
  }, [uuid]);

  return (
    <div>
      <div id="graph" />
    </div>
  );
}
