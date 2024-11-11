import * as d3 from "d3";
import { sankey as d3Sankey, sankeyLeft, sankeyLinkHorizontal } from "d3-sankey";
import { useEffect } from "preact/hooks";

const data = {
  id: 0,
  name: "Root",
  children: [
    {
      id: 1,
      name: "Node 1",
      score: 20,
      children: [
        { id: 2, name: "Node 1.1", score: 10, children: [] },
        { id: 3, name: "Node 1.2", score: 7, children: [] },
        { id: 4, name: "Node 1.3", score: 3, children: [] },
      ],
    },
    { id: 5, name: "Node 2", score: 15, children: [] },
    { id: 6, name: "Node 3", score: 10, children: [] },
  ],
};

function DecisionTree(props: { treeId: string; type: string }): JSX.Element {
  const { treeId, type } = props;
  const id = treeId.split("literal://string:")[1];
  const width = 800;
  const height = 800;

  function buildSankeyData() {
    const nodes = [];
    const links = [];

    function traverseTree(node) {
      if (!nodes.find((n) => n.id === node.id)) nodes.push({ id: node.id, name: node.name });
      node.children.forEach((child) => {
        if (!nodes.find((n) => n.id === child.id)) nodes.push({ id: child.id, name: child.name });
        links.push({ source: node.id, target: child.id, value: child.score });
        traverseTree(child);
      });
    }

    traverseTree(data);

    return { nodes, links };
  }

  useEffect(() => {
    const canvas = d3.select(`#decision-tree-${id}`);
    // remove old tree if present
    d3.select(canvas.node()).select("svg").remove();
    // build new tree
    const svg = d3
      .select(canvas.node())
      .append("svg")
      .attr("id", "svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width}),rotate(90)`);

    const sankey = d3Sankey()
      .nodeAlign(sankeyLeft)
      .nodeId((d) => d.id)
      .nodeWidth(20)
      .nodePadding(30)
      .linkSort((a, b) => a.value - b.value)
      .extent([
        [0, 0],
        [width, width],
      ]);

    const sankeyData = sankey(buildSankeyData());

    // create links
    svg
      .selectAll(".link")
      .data(sankeyData.links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke-width", (d) => Math.max(1, d.width))
      .attr("fill", "none")
      .attr("stroke", "#888")
      .attr("stroke-opacity", 0.5);

    // create nodes
    svg
      .selectAll(".node")
      .data(sankeyData.nodes)
      .enter()
      .append("rect")
      .attr("class", "node")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", sankey.nodeWidth())
      .attr("fill", (d) => {
        if (d.depth === 0) return "var(--j-color-primary-400)";
        return "#69b3a2";
      })
      .attr("stroke", "#000");

    // create node buttons
    svg
      .selectAll(".node")
      .data(sankeyData.nodes)
      .enter()
      .append("rect")
      .attr("class", "node")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", sankey.nodeWidth())
      .attr("fill", (d) => {
        if (d.depth === 0) return "var(--j-color-primary-400)";
        return "#69b3a2";
      })
      .attr("stroke", "#000");

    // create node labels
    svg
      .selectAll(".node-label")
      .data(sankeyData.nodes)
      .enter()
      .append("text")
      .attr("x", (d) => (d.x0 + d.x1) / 2)
      .attr("y", (d) => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("transform", (d) => `rotate(-90 ${(d.x0 + d.x1) / 2}, ${(d.y0 + d.y1) / 2})`)
      .text((d) => d.name)
      .attr("fill", "#000")
      .style("font-size", "12px")
      .style("font-family", "sans-serif");
  }, []);

  return <div id={`decision-tree-${id}`} />;
}

export default DecisionTree;
