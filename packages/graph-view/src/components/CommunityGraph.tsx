import ForceGraph3D, { ForceGraph3DInstance } from "3d-force-graph";
import { useEffect, useState, useRef } from "preact/hooks";
import {
  getAd4mClient,
  LinkExpression,
} from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient, Literal } from "@perspect3vism/ad4m";

export default function CommunityOverview({ uuid }) {
  const graph = useRef<ForceGraph3DInstance>(undefined);
  const graphEl = useRef<HTMLDivElement | null>(null);
  const [ad4mInitialised, setAd4mInitialised] = useState(false);
  const [graphInitialised, setGraphInitialised] = useState(false);
  const [nodes, setNodes] = useState<{ id: string; group: string }[]>([]);
  const [links, setLinks] = useState<{ source: string; target: string }[]>([]);

  console.log("loaded", uuid, nodes, links);

  // Fetch initial snapshot
  useEffect(() => {
    const fetchsnapshot = async () => {
      const client: Ad4mClient = await getAd4mClient();
      const snapshot = await client.perspective.snapshotByUUID(uuid);

      const initialNodes = snapshot.links.map((l) => ({
        id: l.data.target,
        group: l.data.predicate,
      }));
      setNodes(initialNodes);

      const initialLinks = snapshot.links.map((l) => ({
        source: l.data.target,
        target: l.data.source,
      }));
      setLinks(initialLinks);

      setAd4mInitialised(true);

      client.perspective.addPerspectiveLinkAddedListener(uuid, [
        (link) => {
          newLinkAdded(link);
          return null;
        },
      ]);
    };

    if (!ad4mInitialised && uuid) {
      fetchsnapshot();
    }
  }, [ad4mInitialised, uuid]);

  // Setup graph
  useEffect(() => {
    const setupGraph = async () => {
      graph.current = ForceGraph3D()
        .nodeLabel((node) =>
          node.id.startsWith("literal://")
            ? Literal.fromUrl(node.id).get().data
            : node.id
        )
        .nodeAutoColorBy("group")
        .backgroundColor("rgba(0,0,0,0)")
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

          graph.current.cameraPosition(
            newPos, // new position
            node, // lookAt ({ x, y, z })
            3000 // ms transition duration
          );
        });

      graph.current(graphEl.current).graphData({ nodes, links });

      setGraphInitialised(true);
    };

    if (!graphInitialised && nodes.length > 0 && links.length > 0) {
      setupGraph();
    }
  }, [graphInitialised, nodes, links]);

  // listen for changes
  const newLinkAdded = (l: LinkExpression) => {
    console.log("New link added: ", l);

    if (graph.current) {
      const { nodes, links } = graph.current.graphData();

      graph.current.graphData({
        nodes: [
          ...nodes,
          {
            id: l.data.target,
            group: l.data.predicate,
          },
        ],
        links: [
          ...links,
          {
            source: l.data.target,
            target: l.data.source,
          },
        ],
      });
    }
  };

  return (
    <div>
      <div ref={graphEl} id="graph" />
    </div>
  );
}
