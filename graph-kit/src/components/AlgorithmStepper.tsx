import { useState, useEffect } from "react";
import { Detail, ActionPanel, Action, Icon } from "@raycast/api";
import { buildGraphFromData } from "../lib/graph/builder";
import { generateGraphImage } from "../lib/visualization/graphviz";
import type { GraphData, NodeId } from "../lib/types/graph";
import type {
  TraversalStep,
  DijkstraStep,
  FloydWarshallStep,
  ComponentStep,
  SpanningTreeResult,
} from "../lib/types/algorithm";

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

type AlgorithmStep =
  | TraversalStep
  | DijkstraStep
  | FloydWarshallStep
  | ComponentStep
  | NonNullable<SpanningTreeResult["steps"]>[number];

interface AlgorithmStepperProps {
  graphData: GraphData;
  algorithm: AlgorithmType;
  steps: AlgorithmStep[];
  params?: { startNode?: string; endNode?: string };
}

export function AlgorithmStepper({ graphData, algorithm, steps, params }: AlgorithmStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const graph = buildGraphFromData(graphData);

  const step = steps[currentStep];

  // Generate graph visualization when step changes
  useEffect(() => {
    async function generateVisualization() {
      setLoading(true);
      try {
        const nodeColors = new Map<NodeId, string>();

        // Determine node colors based on algorithm type and step
        if ("node" in step && "visited" in step && !("componentIndex" in step)) {
          // BFS/DFS Traversal
          const traversalStep = step as TraversalStep;
          const visited = new Set(Array.from(traversalStep.visited).map(String));

          for (const node of graph.getNodes()) {
            const nodeStr = String(node);
            if (nodeStr === String(traversalStep.node)) {
              nodeColors.set(node, "orange");
            } else if (visited.has(nodeStr)) {
              nodeColors.set(node, "lightgreen");
            } else {
              nodeColors.set(node, "lightgray");
            }
          }
        } else if ("currentNode" in step) {
          // Dijkstra
          const dijkstraStep = step as DijkstraStep;

          for (const node of graph.getNodes()) {
            if (String(node) === String(dijkstraStep.currentNode)) {
              nodeColors.set(node, "orange");
            } else if (dijkstraStep.visited.has(node)) {
              nodeColors.set(node, "lightgreen");
            } else {
              nodeColors.set(node, "lightgray");
            }
          }
        } else if ("componentIndex" in step && "node" in step) {
          // Connected Components
          const compStep = step as ComponentStep;

          for (const node of graph.getNodes()) {
            const nodeStr = String(node);
            if (nodeStr === String(compStep.node)) {
              nodeColors.set(node, "orange");
            } else if (compStep.visited.has(node)) {
              nodeColors.set(node, "lightgreen");
            } else {
              nodeColors.set(node, "lightgray");
            }
          }
        } else {
          // Default coloring for other algorithms (MST, Floyd-Warshall)
          for (const node of graph.getNodes()) {
            nodeColors.set(node, "lightblue");
          }
        }

        const result = await generateGraphImage(graph, {
          nodeColors,
          layout: "dot",
          showWeights: graphData.config.weighted,
        });

        if (result.success && result.imagePath) {
          setImagePath(result.imagePath);
        }
      } catch (error) {
        console.error("Failed to generate graph visualization:", error);
      } finally {
        setLoading(false);
      }
    }

    generateVisualization();
  }, [currentStep, graph, graphData.config.weighted, step]);

  // Get algorithm name
  const algorithmNames: Record<AlgorithmType, string> = {
    bfs: "Breadth-First Search",
    dfs: "Depth-First Search",
    dijkstra: "Dijkstra's Shortest Path",
    "floyd-warshall": "Floyd-Warshall All-Pairs Shortest Path",
    kruskal: "Kruskal's Minimum Spanning Tree",
    prim: "Prim's Minimum Spanning Tree",
    components: "Connected Components",
    metrics: "Graph Metrics",
    properties: "Graph Properties",
  };

  const algorithmName = algorithmNames[algorithm];

  let markdown = `# ${algorithmName} - Step ${currentStep + 1} of ${steps.length}\n\n`;
  if (params?.startNode) {
    markdown += `**Start Node:** ${params.startNode}\n\n`;
  }
  markdown += `---\n\n`;

  // Add graph visualization
  if (imagePath && !loading) {
    markdown += `## Graph Visualization\n\n`;
    markdown += `![Graph](file://${imagePath})\n\n`;
    markdown += `🟠 Current Node  🟢 Visited  ⚪️ Unvisited\n\n`;
    markdown += `---\n\n`;
  }

  // Render step details based on algorithm type
  if ("node" in step && "visited" in step && !("componentIndex" in step)) {
    // BFS/DFS Traversal
    const traversalStep = step as TraversalStep;
    markdown += `## Current Step\n\n`;
    markdown += `**Action:** ${traversalStep.action} node **${traversalStep.node}**`;
    if (traversalStep.from) {
      markdown += ` from **${traversalStep.from}**`;
    }
    markdown += `\n\n`;

    markdown += `## Node States\n\n`;
    markdown += `| Node | Status |\n|------|--------|\n`;

    const visited = new Set(Array.from(traversalStep.visited).map(String));
    const allNodes = graph.getNodes().sort();

    for (const node of allNodes) {
      const nodeStr = String(node);
      let status = "";
      if (nodeStr === String(traversalStep.node)) {
        status = "🔵 Current";
      } else if (visited.has(nodeStr)) {
        status = "✅ Visited";
      } else {
        status = "⚪️ Unvisited";
      }
      markdown += `| ${node} | ${status} |\n`;
    }

    if (traversalStep.queue && traversalStep.queue.length > 0) {
      markdown += `\n**Queue:** [${traversalStep.queue.join(", ")}]\n\n`;
    }
    if (traversalStep.stack && traversalStep.stack.length > 0) {
      markdown += `\n**Stack:** [${traversalStep.stack.join(", ")}]\n\n`;
    }
  } else if ("currentNode" in step) {
    // Dijkstra
    const dijkstraStep = step as DijkstraStep;
    markdown += `## Current Step\n\n`;
    markdown += `**Action:** ${dijkstraStep.action}`;
    if (dijkstraStep.action === "process") {
      markdown += ` node **${dijkstraStep.currentNode}**\n\n`;
    } else if (dijkstraStep.neighbor) {
      markdown += ` edge from **${dijkstraStep.currentNode}** to **${dijkstraStep.neighbor}**\n\n`;
      if (dijkstraStep.oldDistance !== undefined && dijkstraStep.newDistance !== undefined) {
        markdown += `Distance update: ${dijkstraStep.oldDistance === Infinity ? "∞" : dijkstraStep.oldDistance} → ${dijkstraStep.newDistance}\n\n`;
      }
    } else {
      markdown += `\n\n`;
    }

    markdown += `## Distances\n\n`;
    markdown += `| Node | Distance | Status |\n|------|----------|--------|\n`;

    for (const node of graph.getNodes().sort()) {
      const dist = dijkstraStep.distances.get(node) ?? Infinity;
      const distStr = dist === Infinity ? "∞" : String(dist);
      const status = dijkstraStep.visited.has(node)
        ? "✅ Visited"
        : String(node) === String(dijkstraStep.currentNode)
          ? "🔵 Current"
          : "⚪️ Unvisited";
      markdown += `| ${node} | ${distStr} | ${status} |\n`;
    }
  } else if ("componentIndex" in step && "node" in step) {
    // Connected Components
    const compStep = step as ComponentStep;
    markdown += `## Current Step\n\n`;
    if (compStep.action === "start_component") {
      markdown += `**Action:** Start new component #${compStep.componentIndex + 1} at node **${compStep.node}**\n\n`;
    } else {
      markdown += `**Action:** Visit node **${compStep.node}** (Component #${compStep.componentIndex + 1})\n\n`;
    }

    markdown += `## Node States\n\n`;
    markdown += `| Node | Status |\n|------|--------|\n`;

    for (const node of graph.getNodes().sort()) {
      const nodeStr = String(node);
      let status = "";
      if (nodeStr === String(compStep.node)) {
        status = `🔵 Current (Component ${compStep.componentIndex + 1})`;
      } else if (compStep.visited.has(node)) {
        status = "✅ Visited";
      } else {
        status = "⚪️ Unvisited";
      }
      markdown += `| ${node} | ${status} |\n`;
    }
  } else if ("edge" in step) {
    // MST (Kruskal/Prim)
    const mstStep = step as NonNullable<SpanningTreeResult["steps"]>[number];
    markdown += `## Current Step\n\n`;
    markdown += `**Action:** ${mstStep.action} edge **${mstStep.edge.from}** → **${mstStep.edge.to}** (weight: ${mstStep.edge.weight ?? 1})\n\n`;
    markdown += `**Reason:** ${mstStep.reason}\n\n`;
  } else if ("k" in step) {
    // Floyd-Warshall
    const fwStep = step as FloydWarshallStep;
    markdown += `## Current Step\n\n`;
    markdown += `**Iteration k=${fwStep.k}, considering path ${fwStep.i} → ${fwStep.k} → ${fwStep.j}**\n\n`;
    markdown += `**Action:** ${fwStep.action}\n\n`;
    if (fwStep.action === "update" && fwStep.newDistance !== undefined) {
      markdown += `Distance[${fwStep.i}][${fwStep.j}]: ${fwStep.oldDistance === Infinity ? "∞" : fwStep.oldDistance} → ${fwStep.newDistance}\n\n`;
    }

    markdown += `## Distance Matrix\n\n`;
    markdown += `|   |${fwStep.matrix[0].map((_, j) => ` ${j} `).join("|")}|\n`;
    markdown += `|---|${fwStep.matrix[0].map(() => "---").join("|")}|\n`;
    for (let i = 0; i < fwStep.matrix.length; i++) {
      markdown += `| ${i} |`;
      for (let j = 0; j < fwStep.matrix[i].length; j++) {
        const val = fwStep.matrix[i][j];
        const valStr = val === Infinity ? "∞" : String(val);
        markdown += ` ${valStr} |`;
      }
      markdown += `\n`;
    }
  }

  markdown += `\n---\n\n`;
  markdown += `**Progress:** ${currentStep + 1}/${steps.length} (${Math.round(((currentStep + 1) / steps.length) * 100)}%)\n`;

  return (
    <Detail
      isLoading={loading}
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
