import { type NodeId, type Edge } from "./graph";

export interface TraversalStep {
  step: number;
  action: "visit" | "explore" | "backtrack";
  node: NodeId;
  from?: NodeId;
  queue?: NodeId[];
  stack?: NodeId[];
  visited: NodeId[];
}

export interface PathResult {
  path: NodeId[];
  distance: number;
  steps?: TraversalStep[];
}

export interface ShortestPathMatrix {
  distances: number[][];
  next: (NodeId | null)[][];
  nodes: NodeId[];
}

export interface SpanningTreeResult {
  edges: Edge[];
  totalWeight: number;
  steps?: Array<{
    step: number;
    edge: Edge;
    action: "add" | "skip";
    reason: string;
  }>;
}

export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  density: number;
  diameter?: number;
  averageDegree: number;
  degreeDistribution: Map<number, number>;
  isConnected: boolean;
  componentCount: number;
}

export interface ComponentResult {
  components: NodeId[][];
  count: number;
}

export interface BipartiteResult {
  isBipartite: boolean;
  partitions?: [NodeId[], NodeId[]];
}
