import { type NodeId, type Edge, type GraphConfig, type AdjacencyList, type AdjacencyMatrix } from "../types/graph";

export class Graph {
  private adjacencyList: AdjacencyList;
  private nodes: Set<NodeId>;
  private config: GraphConfig;
  private edgeCount: number;

  constructor(config?: Partial<GraphConfig>) {
    this.adjacencyList = {};
    this.nodes = new Set();
    this.edgeCount = 0;
    this.config = {
      directed: config?.directed ?? false,
      weighted: config?.weighted ?? false,
      allowSelfLoops: config?.allowSelfLoops ?? true,
      allowMultipleEdges: config?.allowMultipleEdges ?? false,
    };
  }

  /**
   * Add a node to the graph
   */
  addNode(id: NodeId): void {
    const key = String(id);
    if (!this.nodes.has(id)) {
      this.nodes.add(id);
      this.adjacencyList[key] = [];
    }
  }

  /**
   * Add an edge to the graph
   */
  addEdge(edge: Edge): void {
    const { from, to, weight = 1 } = edge;

    // Check for self-loops
    if (!this.config.allowSelfLoops && from === to) {
      throw new Error(`Self-loops are not allowed in this graph`);
    }

    // Ensure both nodes exist
    this.addNode(from);
    this.addNode(to);

    const fromKey = String(from);
    const toKey = String(to);

    // Check for multiple edges
    if (!this.config.allowMultipleEdges) {
      const existing = this.adjacencyList[fromKey].find((neighbor) => neighbor.node === to);
      if (existing) {
        // Update weight if edge already exists
        existing.weight = weight;
        return;
      }
    }

    // Add edge
    this.adjacencyList[fromKey].push({ node: to, weight });
    this.edgeCount++;

    // If undirected, add reverse edge
    if (!this.config.directed) {
      this.adjacencyList[toKey].push({ node: from, weight });
    }
  }

  /**
   * Remove a node from the graph
   */
  removeNode(id: NodeId): void {
    if (!this.nodes.has(id)) return;

    const key = String(id);

    // Remove all edges connected to this node
    for (const nodeId of this.nodes) {
      this.removeEdge(nodeId, id);
      this.removeEdge(id, nodeId);
    }

    // Remove the node
    delete this.adjacencyList[key];
    this.nodes.delete(id);
  }

  /**
   * Remove an edge from the graph
   */
  removeEdge(from: NodeId, to: NodeId): void {
    const fromKey = String(from);

    if (!this.adjacencyList[fromKey]) return;

    const index = this.adjacencyList[fromKey].findIndex((neighbor) => neighbor.node === to);
    if (index !== -1) {
      this.adjacencyList[fromKey].splice(index, 1);
      this.edgeCount--;

      // If undirected, remove reverse edge
      if (!this.config.directed) {
        const toKey = String(to);
        const reverseIndex = this.adjacencyList[toKey].findIndex((neighbor) => neighbor.node === from);
        if (reverseIndex !== -1) {
          this.adjacencyList[toKey].splice(reverseIndex, 1);
        }
      }
    }
  }

  /**
   * Get neighbors of a node
   */
  getNeighbors(id: NodeId): Array<{ node: NodeId; weight: number }> {
    const key = String(id);
    return this.adjacencyList[key] || [];
  }

  /**
   * Check if an edge exists
   */
  hasEdge(from: NodeId, to: NodeId): boolean {
    const fromKey = String(from);
    if (!this.adjacencyList[fromKey]) return false;
    return this.adjacencyList[fromKey].some((neighbor) => neighbor.node === to);
  }

  /**
   * Get edge weight
   */
  getEdgeWeight(from: NodeId, to: NodeId): number | undefined {
    const fromKey = String(from);
    if (!this.adjacencyList[fromKey]) return undefined;
    const neighbor = this.adjacencyList[fromKey].find((n) => n.node === to);
    return neighbor?.weight;
  }

  /**
   * Get all nodes
   */
  getNodes(): NodeId[] {
    return Array.from(this.nodes);
  }

  /**
   * Get all edges
   */
  getEdges(): Edge[] {
    const edges: Edge[] = [];
    const seen = new Set<string>();

    for (const from of this.nodes) {
      const fromKey = String(from);
      for (const { node: to, weight } of this.adjacencyList[fromKey]) {
        const edgeKey = this.config.directed ? `${from}->${to}` : [from, to].sort().join("-");

        if (!seen.has(edgeKey)) {
          edges.push({ from, to, weight: weight === 1 ? undefined : weight });
          seen.add(edgeKey);
        }
      }
    }

    return edges;
  }

  /**
   * Get degree of a node
   */
  getDegree(id: NodeId): { inDegree: number; outDegree: number; degree: number } {
    const key = String(id);
    const outDegree = this.adjacencyList[key]?.length || 0;

    let inDegree = 0;
    if (this.config.directed) {
      for (const nodeId of this.nodes) {
        if (this.hasEdge(nodeId, id)) {
          inDegree++;
        }
      }
    } else {
      inDegree = outDegree;
    }

    return {
      inDegree,
      outDegree,
      degree: this.config.directed ? inDegree + outDegree : outDegree,
    };
  }

  /**
   * Convert to adjacency matrix
   */
  toAdjacencyMatrix(): AdjacencyMatrix {
    const nodes = this.getNodes();
    const n = nodes.length;
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(Infinity));

    // Initialize diagonal to 0
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 0;
    }

    // Fill in edges
    for (let i = 0; i < n; i++) {
      const from = nodes[i];
      const neighbors = this.getNeighbors(from);

      for (const { node: to, weight } of neighbors) {
        const j = nodes.indexOf(to);
        if (j !== -1) {
          matrix[i][j] = weight;
        }
      }
    }

    return { nodes, matrix };
  }

  /**
   * Get adjacency list
   */
  toAdjacencyList(): AdjacencyList {
    return { ...this.adjacencyList };
  }

  /**
   * Clone the graph
   */
  clone(): Graph {
    const newGraph = new Graph(this.config);
    for (const node of this.nodes) {
      newGraph.addNode(node);
    }
    for (const edge of this.getEdges()) {
      newGraph.addEdge(edge);
    }
    return newGraph;
  }

  /**
   * Reverse the graph (for directed graphs)
   */
  reverse(): Graph {
    if (!this.config.directed) {
      return this.clone();
    }

    const reversed = new Graph(this.config);
    for (const node of this.nodes) {
      reversed.addNode(node);
    }

    for (const edge of this.getEdges()) {
      reversed.addEdge({ from: edge.to, to: edge.from, weight: edge.weight });
    }

    return reversed;
  }

  // Getters
  get nodeCount(): number {
    return this.nodes.size;
  }

  get totalEdgeCount(): number {
    return this.config.directed ? this.edgeCount : this.edgeCount / 2;
  }

  get isDirected(): boolean {
    return this.config.directed;
  }

  get isWeighted(): boolean {
    return this.config.weighted;
  }

  get configuration(): GraphConfig {
    return { ...this.config };
  }
}
