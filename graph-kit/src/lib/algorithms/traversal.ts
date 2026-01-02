import { Graph } from "../graph/Graph";
import { type NodeId } from "../types/graph";
import { type TraversalStep } from "../types/algorithm";

export interface TraversalResult {
  order: NodeId[];
  steps?: TraversalStep[];
}

export interface TraversalOptions {
  recordSteps?: boolean;
}

/**
 * Breadth-First Search (BFS)
 */
export function bfs(graph: Graph, start: NodeId, options?: TraversalOptions): TraversalResult {
  const visited = new Set<NodeId>();
  const queue: NodeId[] = [start];
  const order: NodeId[] = [];
  const steps: TraversalStep[] = [];

  visited.add(start);
  let stepCount = 0;

  if (options?.recordSteps) {
    steps.push({
      step: stepCount++,
      action: "visit",
      node: start,
      queue: [...queue],
      visited: Array.from(visited),
    });
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);

    if (options?.recordSteps) {
      steps.push({
        step: stepCount++,
        action: "explore",
        node: current,
        queue: [...queue],
        visited: Array.from(visited),
      });
    }

    for (const { node: neighbor } of graph.getNeighbors(current)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);

        if (options?.recordSteps) {
          steps.push({
            step: stepCount++,
            action: "visit",
            node: neighbor,
            from: current,
            queue: [...queue],
            visited: Array.from(visited),
          });
        }
      }
    }
  }

  return {
    order,
    steps: options?.recordSteps ? steps : undefined,
  };
}

/**
 * Depth-First Search (DFS)
 */
export function dfs(graph: Graph, start: NodeId, options?: TraversalOptions): TraversalResult {
  const visited = new Set<NodeId>();
  const order: NodeId[] = [];
  const steps: TraversalStep[] = [];
  let stepCount = 0;

  function dfsRecursive(node: NodeId, from?: NodeId) {
    visited.add(node);
    order.push(node);

    if (options?.recordSteps) {
      steps.push({
        step: stepCount++,
        action: "visit",
        node,
        from,
        visited: Array.from(visited),
      });
    }

    for (const { node: neighbor } of graph.getNeighbors(node)) {
      if (!visited.has(neighbor)) {
        if (options?.recordSteps) {
          steps.push({
            step: stepCount++,
            action: "explore",
            node: neighbor,
            from: node,
            visited: Array.from(visited),
          });
        }

        dfsRecursive(neighbor, node);
      }
    }

    if (options?.recordSteps) {
      steps.push({
        step: stepCount++,
        action: "backtrack",
        node,
        visited: Array.from(visited),
      });
    }
  }

  dfsRecursive(start);

  return {
    order,
    steps: options?.recordSteps ? steps : undefined,
  };
}

/**
 * DFS using explicit stack (iterative version)
 */
export function dfsIterative(graph: Graph, start: NodeId, options?: TraversalOptions): TraversalResult {
  const visited = new Set<NodeId>();
  const stack: NodeId[] = [start];
  const order: NodeId[] = [];
  const steps: TraversalStep[] = [];
  let stepCount = 0;

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (visited.has(current)) continue;

    visited.add(current);
    order.push(current);

    if (options?.recordSteps) {
      steps.push({
        step: stepCount++,
        action: "visit",
        node: current,
        stack: [...stack],
        visited: Array.from(visited),
      });
    }

    // Add neighbors in reverse order to match recursive DFS order
    const neighbors = graph.getNeighbors(current);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const neighbor = neighbors[i].node;
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return {
    order,
    steps: options?.recordSteps ? steps : undefined,
  };
}
