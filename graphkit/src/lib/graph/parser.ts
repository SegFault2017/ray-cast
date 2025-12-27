import { type Edge } from "../types/graph";

export interface ParseResult {
  edges: Edge[];
  errors: string[];
  warnings: string[];
}

export interface ParserOptions {
  assumeDirected?: boolean;
  defaultWeight?: number;
}

/**
 * Parse edge input from user
 * Supports formats:
 * - 1-2 (undirected, unweighted)
 * - 1->2 (directed, unweighted)
 * - 1-2:5 (undirected, weighted)
 * - 1->2:5 (directed, weighted)
 * - A-B, A->B (string node IDs)
 */
export function parseEdgeInput(input: string, options?: ParserOptions): ParseResult {
  const edges: Edge[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const assumeDirected = options?.assumeDirected ?? false;
  const defaultWeight = options?.defaultWeight ?? 1;

  // Split by commas, newlines, or semicolons
  const segments = input.split(/[,;\n]+/).map((s) => s.trim()).filter((s) => s.length > 0);

  if (segments.length === 0) {
    errors.push("No edges provided");
    return { edges, errors, warnings };
  }

  let hasDirectedArrows = false;
  let hasUndirectedDashes = false;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const lineNum = i + 1;

    try {
      const edge = parseEdgeSegment(segment, defaultWeight);

      if (edge.isDirected !== undefined) {
        if (edge.isDirected) {
          hasDirectedArrows = true;
        } else {
          hasUndirectedDashes = true;
        }
      }

      edges.push({ from: edge.from, to: edge.to, weight: edge.weight });
    } catch (error) {
      errors.push(`Line ${lineNum}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Warn if mixing directed and undirected notation
  if (hasDirectedArrows && hasUndirectedDashes && !assumeDirected) {
    warnings.push(
      "Mixed directed (->) and undirected (-) notation detected. Treating all as " +
        (assumeDirected ? "directed" : "undirected"),
    );
  }

  return { edges, errors, warnings };
}

interface ParsedEdge {
  from: string | number;
  to: string | number;
  weight?: number;
  isDirected?: boolean;
}

/**
 * Parse a single edge segment
 */
function parseEdgeSegment(segment: string, defaultWeight: number): ParsedEdge {
  // Try to find weight delimiter first (: or =)
  const weightMatch = segment.match(/^(.+?)[:=](.+)$/);

  let edgePart: string;
  let weight: number | undefined;

  if (weightMatch) {
    edgePart = weightMatch[1].trim();
    const weightStr = weightMatch[2].trim();
    weight = parseFloat(weightStr);

    if (isNaN(weight)) {
      throw new Error(`Invalid weight: "${weightStr}"`);
    }
  } else {
    edgePart = segment;
    weight = undefined;
  }

  // Try directed edge first (->)
  let match = edgePart.match(/^(.+?)->(.+)$/);
  if (match) {
    const from = parseNodeId(match[1].trim());
    const to = parseNodeId(match[2].trim());
    return { from, to, weight, isDirected: true };
  }

  // Try undirected edge (-)
  match = edgePart.match(/^(.+?)-(.+)$/);
  if (match) {
    const from = parseNodeId(match[1].trim());
    const to = parseNodeId(match[2].trim());
    return { from, to, weight, isDirected: false };
  }

  // Try bidirectional edge (<->)
  match = edgePart.match(/^(.+?)<->(.+)$/);
  if (match) {
    const from = parseNodeId(match[1].trim());
    const to = parseNodeId(match[2].trim());
    return { from, to, weight, isDirected: false };
  }

  throw new Error(`Invalid edge format: "${segment}". Use formats like "1-2", "1->2", or "1-2:5"`);
}

/**
 * Parse node ID (can be string or number)
 */
function parseNodeId(id: string): string | number {
  // Try to parse as number
  const num = parseFloat(id);
  if (!isNaN(num) && String(num) === id) {
    return num;
  }

  // Otherwise, return as string
  if (id.length === 0) {
    throw new Error("Empty node ID");
  }

  return id;
}

/**
 * Format edges back to string
 */
export function formatEdges(edges: Edge[], directed: boolean = false): string {
  return edges
    .map((edge) => {
      const connector = directed ? "->" : "-";
      const weight = edge.weight !== undefined ? `:${edge.weight}` : "";
      return `${edge.from}${connector}${edge.to}${weight}`;
    })
    .join(", ");
}
