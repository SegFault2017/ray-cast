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

export interface DijkstraStep {
  step: number;
  action: "process" | "relax" | "skip";
  currentNode: NodeId;
  neighbor?: NodeId;
  oldDistance?: number;
  newDistance?: number;
  distances: Map<NodeId, number>;
  visited: Set<NodeId>;
}

export interface FloydWarshallStep {
  step: number;
  k: number;
  i: number;
  j: number;
  action: "update" | "skip";
  oldDistance: number;
  newDistance?: number;
  via?: NodeId;
  matrix: number[][];
}

export interface ComponentStep {
  step: number;
  action: "start_component" | "visit_node";
  node: NodeId;
  componentIndex: number;
  visited: Set<NodeId>;
}

export interface PathResult {
  path: NodeId[];
  distance: number;
  steps?: TraversalStep[] | DijkstraStep[];
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
