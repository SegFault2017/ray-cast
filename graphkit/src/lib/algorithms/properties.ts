import { Graph } from "../graph/Graph";
import { type NodeId } from "../types/graph";

/**
 * Check if graph is complete (every vertex connected to every other vertex)
 */
export function isComplete(graph: Graph): boolean {
  const nodes = graph.getNodes();
  const n = nodes.length;

  if (n <= 1) return true;

  // For undirected graph: each node should have degree n-1
  // For directed graph: each node should have in-degree and out-degree of n-1
  for (const node of nodes) {
    const degree = graph.getDegree(node);

    if (graph.isDirected) {
      if (degree.inDegree !== n - 1 || degree.outDegree !== n - 1) {
        return false;
      }
    } else {
      if (degree.degree !== n - 1) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if graph is a cycle (forms a single cycle)
 */
export function isCycle(graph: Graph): boolean {
  const nodes = graph.getNodes();
  const n = nodes.length;

  if (n < 3) return false;

  // All vertices must have degree 2
  for (const node of nodes) {
    const degree = graph.getDegree(node);
    if (degree.degree !== 2) {
      return false;
    }
  }

  // Must be connected (all nodes reachable from any starting node)
  const visited = new Set<NodeId>();
  const stack = [nodes[0]];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const { node: neighbor } of graph.getNeighbors(current)) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return visited.size === n;
}

/**
 * Check if graph is a path (linear sequence of vertices)
 */
export function isPath(graph: Graph): boolean {
  const nodes = graph.getNodes();
  const n = nodes.length;

  if (n < 2) return n === 1;

  // Should have exactly 2 vertices with degree 1 (endpoints)
  // and all others with degree 2
  let endpointCount = 0;

  for (const node of nodes) {
    const degree = graph.getDegree(node);

    if (degree.degree === 1) {
      endpointCount++;
    } else if (degree.degree !== 2) {
      return false;
    }
  }

  if (endpointCount !== 2) return false;

  // Must be connected
  const visited = new Set<NodeId>();
  const stack = [nodes[0]];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const { node: neighbor } of graph.getNeighbors(current)) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return visited.size === n;
}

/**
 * Check if graph is a star (one central node connected to all others)
 */
export function isStar(graph: Graph): boolean {
  const nodes = graph.getNodes();
  const n = nodes.length;

  if (n < 3) return false;

  // Should have exactly 1 vertex with degree n-1 (center)
  // and all others with degree 1
  let centerCount = 0;

  for (const node of nodes) {
    const degree = graph.getDegree(node);

    if (degree.degree === n - 1) {
      centerCount++;
    } else if (degree.degree !== 1) {
      return false;
    }
  }

  return centerCount === 1;
}

/**
 * Check if graph is a tree (connected acyclic graph)
 */
export function isTree(graph: Graph): boolean {
  if (graph.isDirected) return false;

  const nodes = graph.getNodes();
  const n = nodes.length;

  if (n === 0) return true;
  if (n === 1) return true;

  // A tree with n vertices has exactly n-1 edges
  if (graph.totalEdgeCount !== n - 1) {
    return false;
  }

  // Must be connected
  const visited = new Set<NodeId>();
  const stack = [nodes[0]];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const { node: neighbor } of graph.getNeighbors(current)) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return visited.size === n;
}

/**
 * Simple heuristic check for Hamiltonian cycle existence
 * Note: Determining if a graph is Hamiltonian is NP-complete
 * This provides necessary (but not sufficient) conditions
 */
export function checkHamiltonianConditions(graph: Graph): {
  isPossible: boolean;
  reason: string;
} {
  if (graph.isDirected) {
    return {
      isPossible: false,
      reason: "Hamiltonian cycle detection not implemented for directed graphs",
    };
  }

  const nodes = graph.getNodes();
  const n = nodes.length;

  if (n < 3) {
    return {
      isPossible: false,
      reason: "Graph must have at least 3 vertices",
    };
  }

  // Dirac's theorem: If every vertex has degree ≥ n/2, then graph is Hamiltonian
  let minDegree = Infinity;
  for (const node of nodes) {
    const degree = graph.getDegree(node).degree;
    minDegree = Math.min(minDegree, degree);
  }

  if (minDegree >= n / 2) {
    return {
      isPossible: true,
      reason: `Satisfies Dirac's theorem (min degree ${minDegree} ≥ n/2)`,
    };
  }

  // Ore's theorem: If deg(u) + deg(v) ≥ n for every pair of non-adjacent vertices
  const adjacencyCheck = checkOreTheorem(graph, nodes);
  if (adjacencyCheck) {
    return {
      isPossible: true,
      reason: "Satisfies Ore's theorem",
    };
  }

  return {
    isPossible: false,
    reason: "Does not satisfy Dirac's or Ore's theorem (Hamiltonian cycle may still exist)",
  };
}

function checkOreTheorem(graph: Graph, nodes: NodeId[]): boolean {
  const n = nodes.length;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const u = nodes[i];
      const v = nodes[j];

      // Check if u and v are adjacent
      const neighborsU = graph.getNeighbors(u);
      const isAdjacent = neighborsU.some(({ node }) => node === v);

      if (!isAdjacent) {
        const degreeU = graph.getDegree(u).degree;
        const degreeV = graph.getDegree(v).degree;

        if (degreeU + degreeV < n) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Check if graph is regular (all vertices have same degree)
 */
export function isRegular(graph: Graph): { regular: boolean; degree?: number } {
  const nodes = graph.getNodes();

  if (nodes.length === 0) {
    return { regular: true, degree: 0 };
  }

  const firstDegree = graph.getDegree(nodes[0]).degree;

  for (const node of nodes) {
    if (graph.getDegree(node).degree !== firstDegree) {
      return { regular: false };
    }
  }

  return { regular: true, degree: firstDegree };
}
