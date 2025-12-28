import { Graphviz } from "@hpcc-js/wasm";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { Graph } from "../graph/Graph";
import { type NodeId } from "../types/graph";

// Store the loaded Graphviz instance
let graphvizInstance: any = null;

async function getGraphvizInstance() {
  if (!graphvizInstance) {
    graphvizInstance = await Graphviz.load();
  }
  return graphvizInstance;
}

export interface GraphvizOptions {
  layout?: "dot" | "neato" | "fdp" | "circo" | "twopi" | "sfdp";
  format?: "svg" | "dot" | "json" | "xdot";
  highlightNodes?: NodeId[];
  highlightEdges?: Array<[NodeId, NodeId]>;
  showWeights?: boolean;
  rankdir?: "TB" | "LR" | "BT" | "RL";
}

export interface GraphvizResult {
  success: boolean;
  imagePath?: string;
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * Check if Graphviz WASM is available
 */
export async function checkGraphvizInstalled(): Promise<boolean> {
  try {
    await getGraphvizInstance();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate DOT language representation of a graph
 */
function generateDOT(graph: Graph, options: GraphvizOptions = {}): string {
  const {
    highlightNodes = [],
    highlightEdges = [],
    showWeights = graph.isWeighted,
    rankdir = "TB",
  } = options;

  const graphType = graph.isDirected ? "digraph" : "graph";
  const edgeOp = graph.isDirected ? "->" : "--";

  let dot = `${graphType} G {\n`;
  dot += `  rankdir=${rankdir};\n`;
  dot += `  node [shape=circle, style=filled, fillcolor=lightblue, fontname="Arial"];\n`;
  dot += `  edge [fontname="Arial"];\n\n`;

  // Add nodes
  for (const node of graph.getNodes()) {
    const isHighlighted = highlightNodes.includes(node);
    const fillColor = isHighlighted ? "yellow" : "lightblue";
    dot += `  "${node}" [fillcolor="${fillColor}"];\n`;
  }

  dot += "\n";

  // Add edges
  const edges = graph.getEdges();
  const seenEdges = new Set<string>();

  for (const edge of edges) {
    const edgeKey = graph.isDirected
      ? `${edge.from}->${edge.to}`
      : [edge.from, edge.to].sort().join("-");

    if (seenEdges.has(edgeKey)) continue;
    seenEdges.add(edgeKey);

    const isHighlighted = highlightEdges.some(
      ([from, to]) =>
        (from === edge.from && to === edge.to) ||
        (!graph.isDirected && from === edge.to && to === edge.from),
    );

    const color = isHighlighted ? "red" : "black";
    const penwidth = isHighlighted ? "2.0" : "1.0";

    let edgeLine = `  "${edge.from}" ${edgeOp} "${edge.to}"`;

    const attrs: string[] = [];
    attrs.push(`color="${color}"`);
    attrs.push(`penwidth=${penwidth}`);

    if (showWeights && edge.weight !== undefined && edge.weight !== 1) {
      attrs.push(`label="${edge.weight}"`);
    }

    if (attrs.length > 0) {
      edgeLine += ` [${attrs.join(", ")}]`;
    }

    dot += edgeLine + ";\n";
  }

  dot += "}\n";

  return dot;
}

/**
 * Generate a graph visualization image using Graphviz WASM
 */
export async function generateGraphImage(
  graph: Graph,
  options: GraphvizOptions = {},
): Promise<GraphvizResult> {
  const {
    layout = "dot",
    format = "svg",
  } = options;

  try {
    // Get Graphviz WASM instance
    const graphviz = await getGraphvizInstance();

    // Generate DOT content
    const dotContent = generateDOT(graph, options);

    // Render using WASM
    const output = await graphviz.layout(dotContent, format, layout);

    // Create temporary file for the output
    const timestamp = Date.now();
    const tempDir = tmpdir();
    const outputFile = join(tempDir, `graphkit_${timestamp}.${format}`);

    // Write output to file
    await writeFile(outputFile, output);

    return {
      success: true,
      imagePath: outputFile,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      fallbackUsed: true,
    };
  }
}

/**
 * Get Graphviz installation instructions
 */
export function getGraphvizInstallInstructions(): string {
  return `# Graph Visualization

Graph visualization is powered by **@hpcc-js/wasm** (Graphviz compiled to WebAssembly).

This package should be automatically installed with the extension. If you're seeing this message, try:

1. Reinstalling the extension dependencies:
\`\`\`bash
npm install
\`\`\`

2. Rebuilding the extension:
\`\`\`bash
npm run build
\`\`\`

No external dependencies or Homebrew installation required!`;
}

/**
 * Clean up old temporary graph images
 */
export async function cleanupOldImages(olderThanMs: number = 3600000): Promise<void> {
  // Clean up files older than 1 hour by default
  const { readdir, stat, unlink } = await import("fs/promises");
  const tempDir = tmpdir();

  try {
    const files = await readdir(tempDir);
    const now = Date.now();

    for (const file of files) {
      if (file.startsWith("graphkit_")) {
        const filePath = join(tempDir, file);
        try {
          const stats = await stat(filePath);
          if (now - stats.mtimeMs > olderThanMs) {
            await unlink(filePath);
          }
        } catch {
          /* ignore errors for individual files */
        }
      }
    }
  } catch {
    /* ignore cleanup errors */
  }
}
