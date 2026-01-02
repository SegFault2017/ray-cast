import { Graph } from "../graph/Graph";
import { type NodeId } from "../types/graph";
import { type ComponentResult, type BipartiteResult, type ComponentStep } from "../types/algorithm";

/**
 * Find all connected components using DFS
 */
export function findConnectedComponents(
  graph: Graph,
  options?: { recordSteps?: boolean },
): ComponentResult & { isConnected: boolean; steps?: ComponentStep[] } {
  const visited = new Set<NodeId>();
  const components: NodeId[][] = [];
  const steps: ComponentStep[] = [];
  let stepCount = 0;

  for (const node of graph.getNodes()) {
    if (!visited.has(node)) {
      const component: NodeId[] = [];

      if (options?.recordSteps) {
        steps.push({
          step: stepCount++,
          action: "start_component",
          node,
          componentIndex: components.length,
          visited: new Set(visited),
        });
      }

      dfsVisit(graph, node, visited, component, components.length, options?.recordSteps ? steps : undefined, stepCount);
      if (options?.recordSteps) {
        stepCount = steps.length;
      }
      components.push(component);
    }
  }

  return {
    components,
    count: components.length,
    isConnected: components.length <= 1,
    steps: options?.recordSteps ? steps : undefined,
  };
}

/**
 * Helper function for DFS traversal
 */
function dfsVisit(
  graph: Graph,
  node: NodeId,
  visited: Set<NodeId>,
  component: NodeId[],
  componentIndex: number,
  steps?: ComponentStep[],
  stepCount = 0,
) {
  visited.add(node);
  component.push(node);

  if (steps) {
    steps.push({
      step: stepCount++,
      action: "visit_node",
      node,
      componentIndex,
      visited: new Set(visited),
    });
  }

  for (const { node: neighbor } of graph.getNeighbors(node)) {
    if (!visited.has(neighbor)) {
      dfsVisit(graph, neighbor, visited, component, componentIndex, steps, steps ? steps.length : 0);
    }
  }
}

/**
 * Check if graph is connected
 */
export function isConnected(graph: Graph): boolean {
  if (graph.nodeCount === 0) return true;

  const visited = new Set<NodeId>();
  const start = graph.getNodes()[0];

  dfsVisit(graph, start, visited, []);

  return visited.size === graph.nodeCount;
}

/**
 * Check if graph is bipartite using BFS coloring
 */
export function isBipartite(graph: Graph): BipartiteResult {
  const color = new Map<NodeId, number>();
  const partition1: NodeId[] = [];
  const partition2: NodeId[] = [];

  for (const start of graph.getNodes()) {
    if (color.has(start)) continue;

    const queue: NodeId[] = [start];
    color.set(start, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentColor = color.get(current)!;

      for (const { node: neighbor } of graph.getNeighbors(current)) {
        if (!color.has(neighbor)) {
          color.set(neighbor, 1 - currentColor);
          queue.push(neighbor);
        } else if (color.get(neighbor) === currentColor) {
          // Same color as current node - not bipartite
          return { isBipartite: false };
        }
      }
    }
  }

  // Separate nodes into two partitions
  for (const [node, nodeColor] of color.entries()) {
    if (nodeColor === 0) {
      partition1.push(node);
    } else {
      partition2.push(node);
    }
  }

  return {
    isBipartite: true,
    partitions: [partition1, partition2],
  };
}
