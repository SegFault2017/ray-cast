import { List, ActionPanel, Action, Icon, showToast, Toast, Form, Detail, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { listGraphs } from "./lib/storage/graph-storage";
import { buildGraphFromData } from "./lib/graph/builder";
import { type StoredGraph } from "./lib/types/storage";
import { type GraphData, type NodeId } from "./lib/types/graph";
import { calculateMetrics } from "./lib/algorithms/metrics";
import { bfs, dfs } from "./lib/algorithms/traversal";
import { findConnectedComponents, isBipartite } from "./lib/algorithms/connected-components";
import { dijkstra, floydWarshall } from "./lib/algorithms/shortest-path";
import { kruskal, prim } from "./lib/algorithms/spanning-tree";
import { renderPathASCII, renderMetricsASCII, renderSpanningTreeASCII } from "./lib/visualization/ascii-renderer";

type AlgorithmType =
  | "metrics"
  | "bfs"
  | "dfs"
  | "components"
  | "bipartite"
  | "dijkstra"
  | "floyd-warshall"
  | "kruskal"
  | "prim";

export default function Command() {
  const [graphs, setGraphs] = useState<StoredGraph[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraphs();
  }, []);

  async function loadGraphs() {
    try {
      const allGraphs = await listGraphs();
      setGraphs(allGraphs);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Load Graphs",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <List isLoading={loading} searchBarPlaceholder="Select a graph to analyze...">
      {graphs.length === 0 && !loading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No Graphs Available"
          description="Create a graph first using the Create Graph command"
        />
      ) : (
        graphs.map((graph) => (
          <List.Item
            key={graph.id}
            icon={graph.data.config.directed ? Icon.ArrowRight : Icon.Circle}
            title={graph.data.name}
            subtitle={`${graph.data.nodes.length} nodes, ${graph.data.edges.length} edges`}
            actions={
              <ActionPanel>
                <Action.Push title="Select Algorithm" target={<AlgorithmSelector graph={graph.data} />} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}

function AlgorithmSelector({ graph }: { graph: GraphData }) {
  const algorithms = [
    {
      id: "metrics" as AlgorithmType,
      title: "Graph Metrics",
      subtitle: "Calculate degree, density, diameter, etc.",
      icon: Icon.BarChart,
    },
    {
      id: "bfs" as AlgorithmType,
      title: "Breadth-First Search (BFS)",
      subtitle: "Traverse graph level by level",
      icon: Icon.Circle,
    },
    {
      id: "dfs" as AlgorithmType,
      title: "Depth-First Search (DFS)",
      subtitle: "Traverse graph depth-first",
      icon: Icon.Circle,
    },
    {
      id: "components" as AlgorithmType,
      title: "Connected Components",
      subtitle: "Find all connected components",
      icon: Icon.TwoPeople,
    },
    {
      id: "bipartite" as AlgorithmType,
      title: "Bipartite Check",
      subtitle: "Check if graph is bipartite",
      icon: Icon.TwoPeople,
    },
    {
      id: "dijkstra" as AlgorithmType,
      title: "Dijkstra's Shortest Path",
      subtitle: "Find shortest paths from a start node",
      icon: Icon.Pin,
    },
    {
      id: "floyd-warshall" as AlgorithmType,
      title: "Floyd-Warshall",
      subtitle: "All-pairs shortest paths",
      icon: Icon.Globe,
    },
    {
      id: "kruskal" as AlgorithmType,
      title: "Kruskal's MST",
      subtitle: "Minimum spanning tree",
      icon: Icon.Tree,
      requiresUndirected: true,
    },
    {
      id: "prim" as AlgorithmType,
      title: "Prim's MST",
      subtitle: "Minimum spanning tree",
      icon: Icon.Tree,
      requiresUndirected: true,
    },
  ];

  return (
    <List searchBarPlaceholder="Select an algorithm...">
      {algorithms
        .filter((alg) => !alg.requiresUndirected || !graph.config.directed)
        .map((algorithm) => (
          <List.Item
            key={algorithm.id}
            icon={algorithm.icon}
            title={algorithm.title}
            subtitle={algorithm.subtitle}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Run Algorithm"
                  target={<AlgorithmRunner graph={graph} algorithm={algorithm.id} />}
                />
              </ActionPanel>
            }
          />
        ))}
    </List>
  );
}

function AlgorithmRunner({ graph, algorithm }: { graph: GraphData; algorithm: AlgorithmType }) {
  // Algorithms that need parameters
  const needsStartNode = ["bfs", "dfs", "dijkstra", "prim"];

  if (needsStartNode.includes(algorithm)) {
    return <ParameterForm graph={graph} algorithm={algorithm} />;
  }

  // Run algorithms that don't need parameters immediately
  return <AlgorithmResult graph={graph} algorithm={algorithm} />;
}

function ParameterForm({ graph, algorithm }: { graph: GraphData; algorithm: AlgorithmType }) {
  const nodes = graph.nodes.map((n: { id: NodeId }) => String(n.id));
  const { push } = useNavigation();

  function handleSubmit(values: { startNode: string; endNode?: string }) {
    push(<AlgorithmResult graph={graph} algorithm={algorithm} params={values} />);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Run Algorithm" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text={`Select parameters for ${algorithm.toUpperCase()}`} />

      <Form.Dropdown id="startNode" title="Start Node" defaultValue={nodes[0]}>
        {nodes.map((node: string) => (
          <Form.Dropdown.Item key={node} value={node} title={node} />
        ))}
      </Form.Dropdown>

      {algorithm === "dijkstra" && (
        <Form.Dropdown id="endNode" title="End Node (Optional)" defaultValue="">
          <Form.Dropdown.Item value="" title="All nodes" />
          {nodes.map((node: string) => (
            <Form.Dropdown.Item key={node} value={node} title={node} />
          ))}
        </Form.Dropdown>
      )}
    </Form>
  );
}

function AlgorithmResult({
  graph: graphData,
  algorithm,
  params,
}: {
  graph: GraphData;
  algorithm: AlgorithmType;
  params?: { startNode?: string; endNode?: string };
}) {
  const [markdown, setMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runAlgorithm();
  }, []);

  async function runAlgorithm() {
    try {
      const graph = buildGraphFromData(graphData);
      let result = "";

      switch (algorithm) {
        case "metrics": {
          const metrics = calculateMetrics(graph);
          result = `# Graph Metrics\n\n`;
          result += "```\n";
          result += renderMetricsASCII(
            metrics.nodeCount,
            metrics.edgeCount,
            metrics.density,
            metrics.isConnected,
            metrics.componentCount,
          );
          result += "```\n\n";

          if (metrics.diameter !== undefined) {
            result += `**Diameter:** ${metrics.diameter}\n\n`;
          }

          result += `**Average Degree:** ${metrics.averageDegree.toFixed(2)}\n\n`;

          result += "## Degree Distribution\n\n";
          result += "| Degree | Count |\n|--------|-------|\n";
          const sortedDegrees = Array.from(metrics.degreeDistribution.entries()).sort((a, b) => a[0] - b[0]);
          for (const [degree, count] of sortedDegrees) {
            result += `| ${degree} | ${count} |\n`;
          }
          break;
        }

        case "bfs": {
          if (!params?.startNode) break;
          const { order, steps } = bfs(graph, params.startNode, { recordSteps: true });
          result = `# Breadth-First Search\n\n`;
          result += `**Start Node:** ${params.startNode}\n\n`;
          result += `**Traversal Order:** ${order.join(" → ")}\n\n`;
          result += `**Nodes Visited:** ${order.length}\n\n`;

          if (steps && steps.length > 0) {
            result += "## Step-by-Step\n\n";
            for (const step of steps.slice(0, 20)) {
              // Limit to first 20 steps
              result += `**Step ${step.step}:** ${step.action} node ${step.node}`;
              if (step.from) result += ` from ${step.from}`;
              result += "\n\n";
            }
            if (steps.length > 20) {
              result += `... and ${steps.length - 20} more steps\n\n`;
            }
          }
          break;
        }

        case "dfs": {
          if (!params?.startNode) break;
          const { order, steps } = dfs(graph, params.startNode, { recordSteps: true });
          result = `# Depth-First Search\n\n`;
          result += `**Start Node:** ${params.startNode}\n\n`;
          result += `**Traversal Order:** ${order.join(" → ")}\n\n`;
          result += `**Nodes Visited:** ${order.length}\n\n`;

          if (steps && steps.length > 0) {
            result += "## Step-by-Step\n\n";
            for (const step of steps.slice(0, 20)) {
              result += `**Step ${step.step}:** ${step.action} node ${step.node}`;
              if (step.from) result += ` from ${step.from}`;
              result += "\n\n";
            }
            if (steps.length > 20) {
              result += `... and ${steps.length - 20} more steps\n\n`;
            }
          }
          break;
        }

        case "components": {
          const { components, count, isConnected } = findConnectedComponents(graph);
          result = `# Connected Components\n\n`;
          result += `**Is Connected:** ${isConnected ? "Yes" : "No"}\n\n`;
          result += `**Number of Components:** ${count}\n\n`;

          for (let i = 0; i < components.length; i++) {
            result += `\n## Component ${i + 1}\n\n`;
            result += `Nodes: ${components[i].join(", ")}\n\n`;
            result += `Size: ${components[i].length} nodes\n\n`;
          }
          break;
        }

        case "bipartite": {
          const bipartiteResult = isBipartite(graph);
          result = `# Bipartite Check\n\n`;
          result += `**Is Bipartite:** ${bipartiteResult.isBipartite ? "Yes" : "No"}\n\n`;

          if (bipartiteResult.isBipartite && bipartiteResult.partitions) {
            result += `## Partition 1\n\n`;
            result += `Nodes: ${bipartiteResult.partitions[0].join(", ")}\n\n`;
            result += `## Partition 2\n\n`;
            result += `Nodes: ${bipartiteResult.partitions[1].join(", ")}\n\n`;
          }
          break;
        }

        case "dijkstra": {
          if (!params?.startNode) break;
          const dijkstraResult = dijkstra(graph, params.startNode, params.endNode || undefined);

          result = `# Dijkstra's Shortest Path\n\n`;
          result += `**Start Node:** ${params.startNode}\n\n`;

          if (params.endNode) {
            const pathResult = dijkstraResult as { path: NodeId[]; distance: number };
            result += `**End Node:** ${params.endNode}\n\n`;
            result += "```\n";
            result += renderPathASCII(pathResult.path, pathResult.distance, graph.isWeighted);
            result += "```\n";
          } else {
            const allPaths = dijkstraResult as Map<NodeId, { path: NodeId[]; distance: number }>;
            result += "## Shortest Paths to All Nodes\n\n";

            for (const [node, pathResult] of allPaths.entries()) {
              if (pathResult.path.length > 0) {
                result += `### To ${node}\n\n`;
                result += "```\n";
                result += renderPathASCII(pathResult.path, pathResult.distance, graph.isWeighted);
                result += "```\n\n";
              }
            }
          }
          break;
        }

        case "floyd-warshall": {
          const fwResult = floydWarshall(graph);
          result = `# Floyd-Warshall All-Pairs Shortest Paths\n\n`;
          result += "## Distance Matrix\n\n";

          result += "|     |";
          for (const node of fwResult.nodes) {
            result += ` ${String(node).substring(0, 4)} |`;
          }
          result += "\n";

          result += "|-----|";
          for (let i = 0; i < fwResult.nodes.length; i++) {
            result += "------|";
          }
          result += "\n";

          for (let i = 0; i < fwResult.nodes.length; i++) {
            result += `| ${String(fwResult.nodes[i]).substring(0, 4)} |`;
            for (let j = 0; j < fwResult.nodes.length; j++) {
              const dist = fwResult.distances[i][j];
              result += ` ${dist === Infinity ? "∞" : dist} |`;
            }
            result += "\n";
          }
          break;
        }

        case "kruskal": {
          const mst = kruskal(graph, { recordSteps: false });
          result = `# Kruskal's Minimum Spanning Tree\n\n`;
          result += "```\n";
          result += renderSpanningTreeASCII(mst.edges, mst.totalWeight, graph.isWeighted);
          result += "```\n";
          break;
        }

        case "prim": {
          const mst = prim(graph, params?.startNode, { recordSteps: false });
          result = `# Prim's Minimum Spanning Tree\n\n`;
          if (params?.startNode) {
            result += `**Start Node:** ${params.startNode}\n\n`;
          }
          result += "```\n";
          result += renderSpanningTreeASCII(mst.edges, mst.totalWeight, graph.isWeighted);
          result += "```\n";
          break;
        }
      }

      setMarkdown(result);
    } catch (error) {
      setMarkdown(`# Error\n\n${error instanceof Error ? error.message : String(error)}`);
      await showToast({
        style: Toast.Style.Failure,
        title: "Algorithm Error",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Detail
      isLoading={loading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Results" content={markdown} />
        </ActionPanel>
      }
    />
  );
}
