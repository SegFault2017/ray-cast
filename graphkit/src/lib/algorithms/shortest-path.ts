import { Graph } from "../graph/Graph";
import { type NodeId } from "../types/graph";
import { type PathResult, type ShortestPathMatrix } from "../types/algorithm";

/**
 * Priority Queue implementation for Dijkstra's algorithm
 */
class PriorityQueue<T> {
  private items: Array<{ element: T; priority: number }> = [];

  enqueue(element: T, priority: number) {
    this.items.push({ element, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * Dijkstra's shortest path algorithm
 * Returns shortest path from start to end, or all shortest paths if end is not specified
 */
export function dijkstra(graph: Graph, start: NodeId, end?: NodeId): PathResult | Map<NodeId, PathResult> {
  const distances = new Map<NodeId, number>();
  const previous = new Map<NodeId, NodeId | null>();
  const pq = new PriorityQueue<NodeId>();

  // Initialize distances
  for (const node of graph.getNodes()) {
    distances.set(node, Infinity);
    previous.set(node, null);
  }

  distances.set(start, 0);
  pq.enqueue(start, 0);

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    const currentDist = distances.get(current)!;

    // If we reached the end node, we can stop early
    if (end !== undefined && current === end) {
      break;
    }

    // Skip if we've already found a better path
    if (currentDist === Infinity) continue;

    for (const { node: neighbor, weight } of graph.getNeighbors(current)) {
      const newDist = currentDist + weight;

      if (newDist < distances.get(neighbor)!) {
        distances.set(neighbor, newDist);
        previous.set(neighbor, current);
        pq.enqueue(neighbor, newDist);
      }
    }
  }

  // Build path(s)
  if (end !== undefined) {
    // Single path to specific end node
    const path = reconstructPath(previous, start, end);
    return {
      path,
      distance: distances.get(end)!,
    };
  } else {
    // All shortest paths from start
    const result = new Map<NodeId, PathResult>();

    for (const node of graph.getNodes()) {
      if (node === start) continue;

      const path = reconstructPath(previous, start, node);
      result.set(node, {
        path,
        distance: distances.get(node)!,
      });
    }

    return result;
  }
}

/**
 * Reconstruct path from previous map
 */
function reconstructPath(previous: Map<NodeId, NodeId | null>, start: NodeId, end: NodeId): NodeId[] {
  const path: NodeId[] = [];
  let current: NodeId | null = end;

  while (current !== null) {
    path.unshift(current);
    if (current === start) break;
    current = previous.get(current) ?? null;
  }

  // If path doesn't start with start node, no path exists
  if (path[0] !== start) {
    return [];
  }

  return path;
}

/**
 * Floyd-Warshall algorithm for all-pairs shortest paths
 */
export function floydWarshall(graph: Graph): ShortestPathMatrix {
  const { nodes, matrix } = graph.toAdjacencyMatrix();
  const n = nodes.length;

  // Initialize next matrix for path reconstruction
  const next: (NodeId | null)[][] = Array(n)
    .fill(null)
    .map(() => Array(n).fill(null));

  // Initialize next matrix
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j && matrix[i][j] !== Infinity) {
        next[i][j] = nodes[j];
      }
    }
  }

  // Floyd-Warshall algorithm
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][k] + matrix[k][j] < matrix[i][j]) {
          matrix[i][j] = matrix[i][k] + matrix[k][j];
          next[i][j] = next[i][k];
        }
      }
    }
  }

  return {
    distances: matrix,
    next,
    nodes,
  };
}

/**
 * Reconstruct path from Floyd-Warshall result
 */
export function reconstructFloydWarshallPath(result: ShortestPathMatrix, from: NodeId, to: NodeId): NodeId[] {
  const fromIndex = result.nodes.indexOf(from);
  const toIndex = result.nodes.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) {
    return [];
  }

  if (result.next[fromIndex][toIndex] === null) {
    return [];
  }

  const path: NodeId[] = [from];
  let current = fromIndex;

  while (current !== toIndex) {
    const next = result.next[current][toIndex];
    if (next === null) return [];

    const nextIndex = result.nodes.indexOf(next);
    path.push(next);
    current = nextIndex;
  }

  return path;
}

/**
 * Bellman-Ford algorithm (handles negative weights)
 */
export function bellmanFord(graph: Graph, start: NodeId): Map<NodeId, PathResult> | null {
  const distances = new Map<NodeId, number>();
  const previous = new Map<NodeId, NodeId | null>();

  // Initialize
  for (const node of graph.getNodes()) {
    distances.set(node, Infinity);
    previous.set(node, null);
  }
  distances.set(start, 0);

  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  // Relax edges V-1 times
  for (let i = 0; i < nodes.length - 1; i++) {
    for (const edge of edges) {
      const u = edge.from;
      const v = edge.to;
      const weight = edge.weight ?? 1;

      if (distances.get(u)! + weight < distances.get(v)!) {
        distances.set(v, distances.get(u)! + weight);
        previous.set(v, u);
      }
    }
  }

  // Check for negative cycles
  for (const edge of edges) {
    const u = edge.from;
    const v = edge.to;
    const weight = edge.weight ?? 1;

    if (distances.get(u)! + weight < distances.get(v)!) {
      // Negative cycle detected
      return null;
    }
  }

  // Build result
  const result = new Map<NodeId, PathResult>();

  for (const node of nodes) {
    if (node === start) continue;

    const path = reconstructPath(previous, start, node);
    result.set(node, {
      path,
      distance: distances.get(node)!,
    });
  }

  return result;
}
