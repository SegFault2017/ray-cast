import { Graph } from "../graph/Graph";
import { type NodeId } from "../types/graph";

export interface ASCIIOptions {
  maxWidth?: number;
  showWeights?: boolean;
}

/**
 * Render graph as ASCII adjacency list
 */
// export function renderGraphASCII(graph: Graph, options?: ASCIIOptions): string {
//   const showWeights = options?.showWeights ?? graph.isWeighted;
//   const nodes = graph.getNodes().sort();

//   if (nodes.length === 0) {
//     return "Empty graph (no nodes)";
//   }

//   let output = "";

//   // Header
//   output += graph.isDirected ? "Directed Graph\n" : "Undirected Graph\n";
//   output += `Nodes: ${graph.nodeCount}, Edges: ${graph.totalEdgeCount}\n\n`;

//   // Adjacency list
//   output += "Adjacency List:\n";
//   output += "─".repeat(40) + "\n";

//   for (const node of nodes) {
//     const neighbors = graph.getNeighbors(node);

//     if (neighbors.length === 0) {
//       output += `${node}: (no edges)\n`;
//     } else {
//       const neighborStr = neighbors
//         .map((n) => {
//           if (showWeights && n.weight !== 1) {
//             return `${n.node}(${n.weight})`;
//           }
//           return String(n.node);
//         })
//         .join(", ");

//       output += `${node}: ${neighborStr}\n`;
//     }
//   }

//   return output;
// }

/**
 * Render graph metrics as ASCII
 */
export function renderMetricsASCII(
  nodeCount: number,
  edgeCount: number,
  density: number,
  isConnected: boolean,
  componentCount: number,
): string {
  let output = "";

  output += "Graph Metrics\n";
  output += "─".repeat(40) + "\n";
  output += `Nodes:      ${nodeCount}\n`;
  output += `Edges:      ${edgeCount}\n`;
  output += `Density:    ${density.toFixed(4)}\n`;
  output += `Connected:  ${isConnected ? "Yes" : "No"}\n`;
  output += `Components: ${componentCount}\n`;

  return output;
}

/**
 * Render adjacency matrix as ASCII
 */
export function renderMatrixASCII(graph: Graph): string {
  const { nodes, matrix } = graph.toAdjacencyMatrix();

  if (nodes.length === 0) {
    return "Empty graph";
  }

  if (nodes.length > 20) {
    return "Graph too large to display as matrix (> 20 nodes)";
  }

  let output = "Adjacency Matrix:\n\n";

  // Header row
  output += "     ";
  for (const node of nodes) {
    const nodeStr = String(node).substring(0, 4).padStart(4);
    output += nodeStr + " ";
  }
  output += "\n";

  // Divider
  output += "    " + "─".repeat(nodes.length * 5) + "\n";

  // Matrix rows
  for (let i = 0; i < nodes.length; i++) {
    const nodeStr = String(nodes[i]).substring(0, 4).padEnd(4);
    output += nodeStr + " ";

    for (let j = 0; j < nodes.length; j++) {
      const val = matrix[i][j];
      let cellStr: string;

      if (val === Infinity) {
        cellStr = "∞";
      } else if (val === 0 && i !== j) {
        cellStr = "0";
      } else {
        cellStr = String(val);
      }

      output += cellStr.substring(0, 4).padStart(4) + " ";
    }

    output += "\n";
  }

  return output;
}

/**
 * Render path result as ASCII
 */
export function renderPathASCII(path: NodeId[], distance: number, graphIsWeighted: boolean): string {
  if (path.length === 0) {
    return "No path found";
  }

  let output = "";
  output += "Path: " + path.join(" → ") + "\n";

  if (graphIsWeighted) {
    output += `Total Distance: ${distance}\n`;
  } else {
    output += `Path Length: ${path.length - 1} edge(s)\n`;
  }

  return output;
}

/**
 * Render spanning tree result as ASCII
 */
export function renderSpanningTreeASCII(
  edges: Array<{ from: NodeId; to: NodeId; weight?: number }>,
  totalWeight: number,
  isWeighted: boolean,
): string {
  let output = "";

  output += "Minimum Spanning Tree:\n";
  output += "─".repeat(40) + "\n";

  for (const edge of edges) {
    if (isWeighted && edge.weight) {
      output += `${edge.from} ─(${edge.weight})─ ${edge.to}\n`;
    } else {
      output += `${edge.from} ─ ${edge.to}\n`;
    }
  }

  if (isWeighted) {
    output += `\nTotal Weight: ${totalWeight}\n`;
  }
  output += `Edges in MST: ${edges.length}\n`;

  return output;
}
