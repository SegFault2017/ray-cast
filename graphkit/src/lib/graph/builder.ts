import { Graph } from "./Graph";
import { type GraphData, type NodeId } from "../types/graph";
import { parseEdgeInput } from "./parser";

/**
 * Build a Graph instance from GraphData
 */
export function buildGraphFromData(data: GraphData): Graph {
  const graph = new Graph(data.config);

  // Add all nodes
  for (const node of data.nodes) {
    graph.addNode(node.id);
  }

  // Add all edges
  for (const edge of data.edges) {
    graph.addEdge(edge);
  }

  return graph;
}

/**
 * Convert a Graph instance to GraphData
 */
export function graphToData(
  graph: Graph,
  id: string,
  name: string,
  description?: string,
): GraphData {
  return {
    id,
    name,
    description,
    nodes: graph.getNodes().map((nodeId) => ({ id: nodeId })),
    edges: graph.getEdges(),
    config: graph.configuration,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Build graph from edge input string
 */
export function buildGraphFromEdges(
  edgeInput: string,
  directed: boolean = false,
  weighted: boolean = false,
): { graph: Graph; errors: string[]; warnings: string[] } {
  const parseResult = parseEdgeInput(edgeInput, { assumeDirected: directed });

  if (parseResult.errors.length > 0) {
    return {
      graph: new Graph({ directed, weighted }),
      errors: parseResult.errors,
      warnings: parseResult.warnings,
    };
  }

  const graph = new Graph({ directed, weighted });

  for (const edge of parseResult.edges) {
    graph.addEdge(edge);
  }

  return {
    graph,
    errors: [],
    warnings: parseResult.warnings,
  };
}

/**
 * Graph templates for quick creation
 */
export const templates = {
  /**
   * Complete graph K_n
   */
  complete(n: number, weighted: boolean = false): Graph {
    const graph = new Graph({ directed: false, weighted });

    for (let i = 1; i <= n; i++) {
      graph.addNode(i);
    }

    for (let i = 1; i <= n; i++) {
      for (let j = i + 1; j <= n; j++) {
        graph.addEdge({
          from: i,
          to: j,
          weight: weighted ? Math.floor(Math.random() * 10) + 1 : undefined,
        });
      }
    }

    return graph;
  },

  /**
   * Cycle graph C_n
   */
  cycle(n: number, weighted: boolean = false): Graph {
    const graph = new Graph({ directed: false, weighted });

    for (let i = 1; i <= n; i++) {
      graph.addNode(i);
    }

    for (let i = 1; i <= n; i++) {
      const next = i === n ? 1 : i + 1;
      graph.addEdge({
        from: i,
        to: next,
        weight: weighted ? Math.floor(Math.random() * 10) + 1 : undefined,
      });
    }

    return graph;
  },

  /**
   * Path graph P_n
   */
  path(n: number, weighted: boolean = false): Graph {
    const graph = new Graph({ directed: false, weighted });

    for (let i = 1; i <= n; i++) {
      graph.addNode(i);
    }

    for (let i = 1; i < n; i++) {
      graph.addEdge({
        from: i,
        to: i + 1,
        weight: weighted ? Math.floor(Math.random() * 10) + 1 : undefined,
      });
    }

    return graph;
  },

  /**
   * Binary tree of depth d
   */
  binaryTree(depth: number, weighted: boolean = false): Graph {
    const graph = new Graph({ directed: false, weighted });

    const maxNodes = Math.pow(2, depth + 1) - 1;

    for (let i = 1; i <= maxNodes; i++) {
      graph.addNode(i);
    }

    for (let i = 1; i <= maxNodes; i++) {
      const left = 2 * i;
      const right = 2 * i + 1;

      if (left <= maxNodes) {
        graph.addEdge({
          from: i,
          to: left,
          weight: weighted ? Math.floor(Math.random() * 10) + 1 : undefined,
        });
      }

      if (right <= maxNodes) {
        graph.addEdge({
          from: i,
          to: right,
          weight: weighted ? Math.floor(Math.random() * 10) + 1 : undefined,
        });
      }
    }

    return graph;
  },

  /**
   * Bipartite graph K_{m,n}
   */
  bipartite(m: number, n: number, weighted: boolean = false): Graph {
    const graph = new Graph({ directed: false, weighted });

    // Create nodes for set A
    for (let i = 1; i <= m; i++) {
      graph.addNode(`A${i}`);
    }

    // Create nodes for set B
    for (let i = 1; i <= n; i++) {
      graph.addNode(`B${i}`);
    }

    // Connect all nodes from A to all nodes from B
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        graph.addEdge({
          from: `A${i}`,
          to: `B${j}`,
          weight: weighted ? Math.floor(Math.random() * 10) + 1 : undefined,
        });
      }
    }

    return graph;
  },

  /**
   * Star graph S_n (one central node connected to n outer nodes)
   */
  star(n: number, weighted: boolean = false): Graph {
    const graph = new Graph({ directed: false, weighted });

    graph.addNode("center");

    for (let i = 1; i <= n; i++) {
      graph.addNode(i);
      graph.addEdge({
        from: "center",
        to: i,
        weight: weighted ? Math.floor(Math.random() * 10) + 1 : undefined,
      });
    }

    return graph;
  },
};
