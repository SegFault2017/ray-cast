import { type GraphData } from "./graph";

export interface StoredGraph {
  id: string;
  data: GraphData;
  thumbnailPath?: string;
  lastAccessed: string;
  accessCount: number;
}

export interface AnalysisCache {
  graphId: string;
  algorithmName: string;
  result: unknown;
  timestamp: string;
}

export interface UserPreferences {
  defaultGraphType: "directed" | "undirected";
  visualizationTool: "graphviz" | "ascii" | "auto";
  showStepByStep: boolean;
  cacheAnalysisResults: boolean;
}
