import { Graph } from "../graph/Graph";
import { type NodeId } from "../types/graph";
import { type GraphMetrics } from "../types/algorithm";
import { findConnectedComponents } from "./connected-components";

/**
 * Calculate degree of a specific node
 */
export function calculateDegree(
  graph: Graph,
  nodeId: NodeId,
): {
  inDegree: number;
  outDegree: number;
  degree: number;
} {
  return graph.getDegree(nodeId);
}

/**
 * Calculate graph density
 * Density = (2 * |E|) / (|V| * (|V| - 1)) for undirected graphs
 * Density = |E| / (|V| * (|V| - 1)) for directed graphs
 */
export function calculateDensity(graph: Graph): number {
  const n = graph.nodeCount;

  if (n <= 1) return 0;

  const maxEdges = n * (n - 1);
  const actualEdges = graph.totalEdgeCount;

  if (graph.isDirected) {
    return actualEdges / maxEdges;
  } else {
    return (2 * actualEdges) / maxEdges;
  }
}

/**
 * Calculate average degree
 */
export function calculateAverageDegree(graph: Graph): number {
  if (graph.nodeCount === 0) return 0;

  const nodes = graph.getNodes();
  const totalDegree = nodes.reduce((sum, node) => {
    const { degree } = graph.getDegree(node);
    return sum + degree;
  }, 0);

  return totalDegree / graph.nodeCount;
}

/**
 * Calculate degree distribution
 */
export function calculateDegreeDistribution(graph: Graph): Map<number, number> {
  const distribution = new Map<number, number>();

  for (const node of graph.getNodes()) {
    const { degree } = graph.getDegree(node);
    distribution.set(degree, (distribution.get(degree) || 0) + 1);
  }

  return distribution;
}

/**
 * Calculate graph diameter using BFS from each node
 * Returns undefined if graph is not connected
 */
export function calculateDiameter(graph: Graph): number | undefined {
  const nodes = graph.getNodes();

  if (nodes.length === 0) return undefined;

  // Check if graph is connected first
  const { isConnected } = findConnectedComponents(graph);
  if (!isConnected) return undefined;

  let diameter = 0;

  // For each node, find the longest shortest path
  for (const start of nodes) {
    const distances = bfsDistances(graph, start);
    const maxDistance = Math.max(...Array.from(distances.values()));

    if (maxDistance === Infinity) {
      // Graph is not connected
      return undefined;
    }

    diameter = Math.max(diameter, maxDistance);
  }

  return diameter;
}

/**
 * Helper function to calculate distances using BFS
 */
function bfsDistances(graph: Graph, start: NodeId): Map<NodeId, number> {
  const distances = new Map<NodeId, number>();
  const queue: NodeId[] = [start];
  distances.set(start, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(current)!;

    for (const { node } of graph.getNeighbors(current)) {
      if (!distances.has(node)) {
        distances.set(node, currentDist + 1);
        queue.push(node);
      }
    }
  }

  // Set unvisited nodes to Infinity
  for (const node of graph.getNodes()) {
    if (!distances.has(node)) {
      distances.set(node, Infinity);
    }
  }

  return distances;
}

/**
 * Calculate comprehensive graph metrics
 */
export function calculateMetrics(graph: Graph): GraphMetrics {
  const { components, isConnected } = findConnectedComponents(graph);

  return {
    nodeCount: graph.nodeCount,
    edgeCount: graph.totalEdgeCount,
    density: calculateDensity(graph),
    diameter: calculateDiameter(graph),
    averageDegree: calculateAverageDegree(graph),
    degreeDistribution: calculateDegreeDistribution(graph),
    isConnected,
    componentCount: components.length,
  };
}
