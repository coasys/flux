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

      const gData = {
        nodes: snapshot.links.map((l) => ({
          id: l.data.target,
          group: l.data.predicate,
        })),
        links: snapshot.links.map((l) => ({
          source: l.data.target,
          target: l.data.source,
        })),
      };

      const Graph = ForceGraph3D()
        .nodeLabel("id")
        .nodeAutoColorBy("group")
        .onNodeClick((node: { x; y; z }) => {
          // Aim at node from outside it
          const distance = 40;
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

          const newPos =
            node.x || node.y || node.z
              ? {
                  x: node.x * distRatio,
                  y: node.y * distRatio,
                  z: node.z * distRatio,
                }
              : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

          Graph.cameraPosition(
            newPos, // new position
            node, // lookAt ({ x, y, z })
            3000 // ms transition duration
          );
        });
      Graph(document.getElementById("graph")).graphData(gData);
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
