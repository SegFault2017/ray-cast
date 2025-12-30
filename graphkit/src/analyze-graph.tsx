import { List, ActionPanel, Action, Icon, showToast, Toast, Form, Detail, useNavigation, confirmAlert, Alert } from "@raycast/api";
import { useEffect, useState } from "react";
import { listGraphs, deleteGraph } from "./lib/storage/graph-storage";
import { buildGraphFromData } from "./lib/graph/builder";
import { GraphDetail } from "./components/GraphDetail";
import { type StoredGraph } from "./lib/types/storage";
import { type GraphData, type NodeId } from "./lib/types/graph";
import { calculateMetrics } from "./lib/algorithms/metrics";
import { bfs, dfs } from "./lib/algorithms/traversal";
import { findConnectedComponents, isBipartite } from "./lib/algorithms/connected-components";
import { dijkstra, floydWarshall } from "./lib/algorithms/shortest-path";
import { kruskal, prim } from "./lib/algorithms/spanning-tree";
import {
  isComplete,
  isCycle,
  isPath,
  isStar,
  isTree,
  isRegular,
  checkHamiltonianConditions,
} from "./lib/algorithms/properties";
import { renderPathASCII, renderMetricsASCII, renderSpanningTreeASCII } from "./lib/visualization/ascii-renderer";

type AlgorithmType =
  | "metrics"
  | "properties"
  | "bfs"
  | "dfs"
  | "components"
  | "dijkstra"
  | "floyd-warshall"
  | "kruskal"
  | "prim";

interface AlgorithmStep {
  step: number;
  action: string;
  node: NodeId;
  from?: NodeId;
}

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

  async function handleDelete(graph: StoredGraph) {
    if (
      await confirmAlert({
        title: "Delete Graph",
        message: `Are you sure you want to delete "${graph.data.name}"?`,
        primaryAction: {
          title: "Delete",
          style: Alert.ActionStyle.Destructive,
        },
      })
    ) {
      try {
        await deleteGraph(graph.id);
        await showToast({
          style: Toast.Style.Success,
          title: "Graph Deleted",
          message: `"${graph.data.name}" has been deleted`,
        });
        await loadGraphs();
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to Delete Graph",
          message: error instanceof Error ? error.message : String(error),
        });
      }
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
                <Action.Push
                  title="Diagnose Graph"
                  icon={Icon.Checkmark}
                  target={<AlgorithmResult graph={graph.data} algorithm="properties" />}
                />
                <Action.Push
                  title="Graph Metrics"
                  icon={Icon.BarChart}
                  target={<AlgorithmResult graph={graph.data} algorithm="metrics" />}
                />
                <Action.Push title="More Algorithms" target={<AlgorithmSelector graph={graph.data} />} />
                <Action.Push
                  title="View Details & Visualization"
                  icon={Icon.Eye}
                  target={<GraphDetail graphId={graph.id} onDelete={loadGraphs} />}
                  shortcut={{ modifiers: ["cmd"], key: "v" }}
                />
                <Action
                  title="Delete Graph"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={() => handleDelete(graph)}
                  shortcut={{ modifiers: ["ctrl"], key: "d" }}
                />
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
      id: "bfs" as AlgorithmType,
      title: "Breadth-First Search (BFS)",
      subtitle: "Traverse graph level by level",
      icon: Icon.Circle,
      supportsSteps: true,
    },
    {
      id: "dfs" as AlgorithmType,
      title: "Depth-First Search (DFS)",
      subtitle: "Traverse graph depth-first",
      icon: Icon.Circle,
      supportsSteps: true,
    },
    {
      id: "components" as AlgorithmType,
      title: "Connected Components",
      subtitle: "Find all connected components",
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
                {algorithm.supportsSteps && (
                  <Action.Push
                    title="View Step-by-Step"
                    icon={Icon.Eye}
                    target={<AlgorithmRunner graph={graph} algorithm={algorithm.id} withSteps={true} />}
                    shortcut={{ modifiers: ["cmd"], key: "s" }}
                  />
                )}
              </ActionPanel>
            }
          />
        ))}
    </List>
  );
}

function AlgorithmRunner({ graph, algorithm, withSteps }: { graph: GraphData; algorithm: AlgorithmType; withSteps?: boolean }) {
  // Algorithms that need parameters
  const needsStartNode = ["bfs", "dfs", "dijkstra", "prim"];

  if (needsStartNode.includes(algorithm)) {
    return <ParameterForm graph={graph} algorithm={algorithm} withSteps={withSteps} />;
  }

  // Run algorithms that don't need parameters immediately
  return <AlgorithmResult graph={graph} algorithm={algorithm} withSteps={withSteps} />;
}

function ParameterForm({ graph, algorithm, withSteps }: { graph: GraphData; algorithm: AlgorithmType; withSteps?: boolean }) {
  const nodes = graph.nodes.map((n: { id: NodeId }) => String(n.id));
  const { push } = useNavigation();

  function handleSubmit(values: { startNode: string; endNode?: string }) {
    push(<AlgorithmResult graph={graph} algorithm={algorithm} params={values} withSteps={withSteps} />);
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
  withSteps,
}: {
  graph: GraphData;
  algorithm: AlgorithmType;
  params?: { startNode?: string; endNode?: string };
  withSteps?: boolean;
}) {
  const [markdown, setMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);

  useEffect(() => {
    runAlgorithm();
  }, []);

  // If in step mode, show stepper interface
  if (withSteps && !loading && steps.length > 0) {
    return <AlgorithmStepper graphData={graphData} algorithm={algorithm} steps={steps} params={params} />;
  }

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

        case "properties": {
          result = `# Graph Diagnosis\n\n`;
          result += "## Graph Type Classification\n\n";

          const complete = isComplete(graph);
          const cycle = isCycle(graph);
          const path = isPath(graph);
          const star = isStar(graph);
          const tree = isTree(graph);
          const bipartiteResult = isBipartite(graph);
          const regular = isRegular(graph);
          const hamiltonian = checkHamiltonianConditions(graph);

          result += "| Property | Status |\n|----------|--------|\n";
          result += `| **Complete Graph** | ${complete ? "✅ Yes" : "❌ No"} |\n`;
          result += `| **Cycle Graph** | ${cycle ? "✅ Yes" : "❌ No"} |\n`;
          result += `| **Path Graph** | ${path ? "✅ Yes" : "❌ No"} |\n`;
          result += `| **Star Graph** | ${star ? "✅ Yes" : "❌ No"} |\n`;
          result += `| **Tree** | ${tree ? "✅ Yes" : "❌ No"} |\n`;
          result += `| **Bipartite** | ${bipartiteResult.isBipartite ? "✅ Yes" : "❌ No"} |\n`;
          result += `| **Regular Graph** | ${regular.regular ? `✅ Yes (degree ${regular.degree})` : "❌ No"} |\n`;

          result += "\n## Hamiltonian Cycle Analysis\n\n";
          result += `**Possibility:** ${hamiltonian.isPossible ? "✅ Possible" : "❌ Unlikely"}\n\n`;
          result += `**Reason:** ${hamiltonian.reason}\n\n`;

          if (bipartiteResult.isBipartite && bipartiteResult.partitions) {
            result += "## Bipartite Partitions\n\n";
            result += `**Partition 1:** ${bipartiteResult.partitions[0].join(", ")}\n\n`;
            result += `**Partition 2:** ${bipartiteResult.partitions[1].join(", ")}\n\n`;
          }

          result += "## Summary\n\n";
          const types = [];
          if (complete) types.push("Complete");
          if (cycle) types.push("Cycle");
          if (path) types.push("Path");
          if (star) types.push("Star");
          if (tree) types.push("Tree");
          if (bipartiteResult.isBipartite) types.push("Bipartite");
          if (regular.regular) types.push(`${regular.degree}-Regular`);

          if (types.length > 0) {
            result += `This graph is: **${types.join(", ")}**\n`;
          } else {
            result += "This graph does not match any special graph types.\n";
          }

          break;
        }

        case "bfs": {
          if (!params?.startNode) break;
          const bfsResult = bfs(graph, params.startNode, { recordSteps: true });

          if (withSteps && bfsResult.steps) {
            setSteps(bfsResult.steps);
            return;
          }

          result = `# Breadth-First Search\n\n`;
          result += `**Start Node:** ${params.startNode}\n\n`;
          result += `**Traversal Order:** ${bfsResult.order.join(" → ")}\n\n`;
          result += `**Nodes Visited:** ${bfsResult.order.length}\n\n`;

          if (bfsResult.steps && bfsResult.steps.length > 0) {
            result += "## Step-by-Step\n\n";
            for (const step of bfsResult.steps.slice(0, 20)) {
              // Limit to first 20 steps
              result += `**Step ${step.step}:** ${step.action} node ${step.node}`;
              if (step.from) result += ` from ${step.from}`;
              result += "\n\n";
            }
            if (bfsResult.steps.length > 20) {
              result += `... and ${bfsResult.steps.length - 20} more steps\n\n`;
            }
          }
          break;
        }

        case "dfs": {
          if (!params?.startNode) break;
          const dfsResult = dfs(graph, params.startNode, { recordSteps: true });

          if (withSteps && dfsResult.steps) {
            setSteps(dfsResult.steps);
            return;
          }

          result = `# Depth-First Search\n\n`;
          result += `**Start Node:** ${params.startNode}\n\n`;
          result += `**Traversal Order:** ${dfsResult.order.join(" → ")}\n\n`;
          result += `**Nodes Visited:** ${dfsResult.order.length}\n\n`;

          if (dfsResult.steps && dfsResult.steps.length > 0) {
            result += "## Step-by-Step\n\n";
            for (const step of dfsResult.steps.slice(0, 20)) {
              result += `**Step ${step.step}:** ${step.action} node ${step.node}`;
              if (step.from) result += ` from ${step.from}`;
              result += "\n\n";
            }
            if (dfsResult.steps.length > 20) {
              result += `... and ${dfsResult.steps.length - 20} more steps\n\n`;
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

function AlgorithmStepper({
  graphData,
  algorithm,
  steps,
  params,
}: {
  graphData: GraphData;
  algorithm: AlgorithmType;
  steps: AlgorithmStep[];
  params?: { startNode?: string; endNode?: string };
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const graph = buildGraphFromData(graphData);

  const step = steps[currentStep];
  const visited = new Set<string>();

  // Build visited set up to current step
  for (let i = 0; i <= currentStep; i++) {
    if (steps[i].action === "visit") {
      visited.add(String(steps[i].node));
    }
  }

  const algorithmName = algorithm === "bfs" ? "Breadth-First Search" : "Depth-First Search";

  let markdown = `# ${algorithmName} - Step ${currentStep + 1} of ${steps.length}\n\n`;
  markdown += `**Start Node:** ${params?.startNode}\n\n`;
  markdown += `---\n\n`;
  markdown += `## Current Step\n\n`;
  markdown += `**Action:** ${step.action} node **${step.node}**`;
  if (step.from) {
    markdown += ` from **${step.from}**`;
  }
  markdown += `\n\n`;

  markdown += `## Node States\n\n`;
  markdown += `| Node | Status |\n|------|--------|\n`;

  const allNodes = graph.getNodes().sort();
  for (const node of allNodes) {
    const nodeStr = String(node);
    let status = "";
    if (nodeStr === String(step.node)) {
      status = "🔵 Current";
    } else if (visited.has(nodeStr)) {
      status = "✅ Visited";
    } else {
      status = "⚪️ Unvisited";
    }
    markdown += `| ${node} | ${status} |\n`;
  }

  markdown += `\n## Graph Structure\n\n`;
  markdown += `**Adjacency List:**\n\n`;
  for (const node of allNodes) {
    const neighbors = graph.getNeighbors(node).map(n => String(n.node));
    const nodeStr = String(node);
    let nodeLabel = `${node}`;
    if (nodeStr === String(step.node)) {
      nodeLabel = `**${node}** 🔵`;
    } else if (visited.has(nodeStr)) {
      nodeLabel = `${node} ✅`;
    }
    markdown += `- ${nodeLabel}: [${neighbors.join(", ")}]\n`;
  }

  markdown += `\n---\n\n`;
  markdown += `**Progress:** ${currentStep + 1}/${steps.length} (${Math.round(((currentStep + 1) / steps.length) * 100)}%)\n`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            title="Next Step"
            icon={Icon.ArrowRight}
            onAction={() => setCurrentStep(Math.min(currentStep + 1, steps.length - 1))}
            shortcut={{ modifiers: ["cmd"], key: "arrowRight" }}
          />
          <Action
            title="Previous Step"
            icon={Icon.ArrowLeft}
            onAction={() => setCurrentStep(Math.max(currentStep - 1, 0))}
            shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }}
          />
          <Action
            title="First Step"
            icon={Icon.ArrowLeftCircle}
            onAction={() => setCurrentStep(0)}
            shortcut={{ modifiers: ["cmd", "shift"], key: "arrowLeft" }}
          />
          <Action
            title="Last Step"
            icon={Icon.ArrowRightCircle}
            onAction={() => setCurrentStep(steps.length - 1)}
            shortcut={{ modifiers: ["cmd", "shift"], key: "arrowRight" }}
          />
        </ActionPanel>
      }
    />
  );
}
