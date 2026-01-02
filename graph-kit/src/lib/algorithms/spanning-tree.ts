import { Graph } from "../graph/Graph";
import { type NodeId, type Edge } from "../types/graph";
import { type SpanningTreeResult } from "../types/algorithm";

/**
 * Union-Find (Disjoint Set Union) data structure
 */
class UnionFind {
  private parent: Map<NodeId, NodeId>;
  private rank: Map<NodeId, number>;

  constructor(nodes: NodeId[]) {
    this.parent = new Map();
    this.rank = new Map();

    for (const node of nodes) {
      this.parent.set(node, node);
      this.rank.set(node, 0);
    }
  }

  find(node: NodeId): NodeId {
    if (this.parent.get(node) !== node) {
      // Path compression
      this.parent.set(node, this.find(this.parent.get(node)!));
    }
    return this.parent.get(node)!;
  }

  union(node1: NodeId, node2: NodeId): boolean {
    const root1 = this.find(node1);
    const root2 = this.find(node2);

    if (root1 === root2) {
      return false; // Already in same set
    }

    // Union by rank
    const rank1 = this.rank.get(root1)!;
    const rank2 = this.rank.get(root2)!;

    if (rank1 < rank2) {
      this.parent.set(root1, root2);
    } else if (rank1 > rank2) {
      this.parent.set(root2, root1);
    } else {
      this.parent.set(root2, root1);
      this.rank.set(root1, rank1 + 1);
    }

    return true;
  }
}

/**
 * Kruskal's algorithm for Minimum Spanning Tree
 */
export function kruskal(graph: Graph, options?: { recordSteps?: boolean }): SpanningTreeResult {
  if (graph.isDirected) {
    throw new Error("Kruskal's algorithm only works on undirected graphs");
  }

  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  // Sort edges by weight
  const sortedEdges = [...edges].sort((a, b) => {
    const weightA = a.weight ?? 1;
    const weightB = b.weight ?? 1;
    return weightA - weightB;
  });

  const uf = new UnionFind(nodes);
  const mstEdges: Edge[] = [];
  const steps: SpanningTreeResult["steps"] = [];
  let totalWeight = 0;
  let stepCount = 0;

  for (const edge of sortedEdges) {
    const { from, to, weight = 1 } = edge;

    if (uf.find(from) !== uf.find(to)) {
      // Edge doesn't create a cycle, add it to MST
      uf.union(from, to);
      mstEdges.push(edge);
      totalWeight += weight;

      if (options?.recordSteps) {
        steps.push({
          step: stepCount++,
          edge,
          action: "add",
          reason: "Edge connects two different components",
        });
      }

      // Stop if we have n-1 edges (complete spanning tree)
      if (mstEdges.length === nodes.length - 1) {
        break;
      }
    } else {
      if (options?.recordSteps) {
        steps.push({
          step: stepCount++,
          edge,
          action: "skip",
          reason: "Edge would create a cycle",
        });
      }
    }
  }

  return {
    edges: mstEdges,
    totalWeight,
    steps: options?.recordSteps ? steps : undefined,
  };
}

/**
 * Prim's algorithm for Minimum Spanning Tree
 */
export function prim(graph: Graph, start?: NodeId, options?: { recordSteps?: boolean }): SpanningTreeResult {
  if (graph.isDirected) {
    throw new Error("Prim's algorithm only works on undirected graphs");
  }

  const nodes = graph.getNodes();

  if (nodes.length === 0) {
    return { edges: [], totalWeight: 0 };
  }

  const startNode = start ?? nodes[0];
  const visited = new Set<NodeId>([startNode]);
  const mstEdges: Edge[] = [];
  const steps: SpanningTreeResult["steps"] = [];
  let totalWeight = 0;
  let stepCount = 0;

  // Priority queue of edges (edge, weight)
  const pq: Array<{ edge: Edge; weight: number }> = [];

  // Add all edges from start node
  for (const { node: neighbor, weight } of graph.getNeighbors(startNode)) {
    pq.push({ edge: { from: startNode, to: neighbor, weight }, weight });
  }

  while (pq.length > 0 && visited.size < nodes.length) {
    // Sort to get minimum weight edge (simple priority queue)
    pq.sort((a, b) => a.weight - b.weight);
    const { edge, weight } = pq.shift()!;

    // Skip if both endpoints are already in MST
    if (visited.has(edge.to)) {
      if (options?.recordSteps) {
        steps.push({
          step: stepCount++,
          edge,
          action: "skip",
          reason: "Both endpoints already in MST",
        });
      }
      continue;
    }

    // Add edge to MST
    visited.add(edge.to);
    mstEdges.push(edge);
    totalWeight += weight;

    if (options?.recordSteps) {
      steps.push({
        step: stepCount++,
        edge,
        action: "add",
        reason: "Minimum weight edge connecting MST to new node",
      });
    }

    // Add all edges from newly added node
    for (const { node: neighbor, weight: neighborWeight } of graph.getNeighbors(edge.to)) {
      if (!visited.has(neighbor)) {
        pq.push({
          edge: { from: edge.to, to: neighbor, weight: neighborWeight },
          weight: neighborWeight,
        });
      }
    }
  }

  return {
    edges: mstEdges,
    totalWeight,
    steps: options?.recordSteps ? steps : undefined,
  };
}
