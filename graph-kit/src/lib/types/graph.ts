export type NodeId = string | number;

export interface Edge {
  from: NodeId;
  to: NodeId;
  weight?: number;
}

export interface Node {
  id: NodeId;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphConfig {
  directed: boolean;
  weighted: boolean;
  allowSelfLoops: boolean;
  allowMultipleEdges: boolean;
}

export interface GraphData {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  config: GraphConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AdjacencyList {
  [key: string]: Array<{ node: NodeId; weight: number }>;
}

export interface AdjacencyMatrix {
  nodes: NodeId[];
  matrix: number[][];
}
