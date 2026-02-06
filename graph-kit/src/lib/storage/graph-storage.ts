import { LocalStorage } from "@raycast/api";
import { type GraphData, type StoredGraph } from "../types/storage";

const STORAGE_KEYS = {
  GRAPHS: "graphs",
  GRAPH_PREFIX: "graph_",
};

/**
 * Save a graph to LocalStorage
 */
export async function saveGraph(graph: GraphData): Promise<void> {
  try {
    // Get existing graphs
    const graphs = await listGraphs();

    // Check if graph already exists
    const existingIndex = graphs.findIndex((g) => g.id === graph.id);

    const storedGraph: StoredGraph = {
      id: graph.id,
      data: graph,
      lastAccessed: new Date().toISOString(),
      accessCount: existingIndex >= 0 ? graphs[existingIndex].accessCount + 1 : 1,
    };

    if (existingIndex >= 0) {
      graphs[existingIndex] = storedGraph;
    } else {
      graphs.push(storedGraph);
    }

    // Save individual graph
    await LocalStorage.setItem(`${STORAGE_KEYS.GRAPH_PREFIX}${graph.id}`, JSON.stringify(storedGraph));

    // Update graph list
    await LocalStorage.setItem(STORAGE_KEYS.GRAPHS, JSON.stringify(graphs.map((g) => g.id)));
  } catch (error) {
    throw new Error(`Failed to save graph: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load a graph from LocalStorage
 */
export async function loadGraph(id: string): Promise<GraphData | undefined> {
  try {
    const item = await LocalStorage.getItem<string>(`${STORAGE_KEYS.GRAPH_PREFIX}${id}`);

    if (!item) {
      return undefined;
    }

    const storedGraph = JSON.parse(item) as StoredGraph;

    // Update access time and count
    storedGraph.lastAccessed = new Date().toISOString();
    storedGraph.accessCount++;
    await LocalStorage.setItem(`${STORAGE_KEYS.GRAPH_PREFIX}${id}`, JSON.stringify(storedGraph));

    return storedGraph.data;
  } catch (error) {
    console.error(`Failed to load graph ${id}:`, error);
    return undefined;
  }
}

/**
 * List all saved graphs
 */
export async function listGraphs(): Promise<StoredGraph[]> {
  try {
    const graphIds = await LocalStorage.getItem<string>(STORAGE_KEYS.GRAPHS);

    if (!graphIds) {
      return [];
    }

    const ids = JSON.parse(graphIds) as string[];
    const graphs: StoredGraph[] = [];

    for (const id of ids) {
      const item = await LocalStorage.getItem<string>(`${STORAGE_KEYS.GRAPH_PREFIX}${id}`);
      if (item) {
        try {
          const graph = JSON.parse(item) as StoredGraph;
          graphs.push(graph);
        } catch (error) {
          console.error(`Failed to parse graph ${id}:`, error);
        }
      }
    }

    return graphs;
  } catch (error) {
    console.error("Failed to list graphs:", error);
    return [];
  }
}

/**
 * Delete a graph from LocalStorage
 */
export async function deleteGraph(id: string): Promise<void> {
  try {
    // Remove individual graph
    await LocalStorage.removeItem(`${STORAGE_KEYS.GRAPH_PREFIX}${id}`);

    // Update graph list
    const graphs = await listGraphs();
    const filtered = graphs.filter((g) => g.id !== id);
    await LocalStorage.setItem(STORAGE_KEYS.GRAPHS, JSON.stringify(filtered.map((g) => g.id)));
  } catch (error) {
    throw new Error(`Failed to delete graph: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update graph access metadata
 */
export async function updateGraphAccess(id: string): Promise<void> {
  try {
    const item = await LocalStorage.getItem<string>(`${STORAGE_KEYS.GRAPH_PREFIX}${id}`);

    if (!item) return;

    const storedGraph = JSON.parse(item) as StoredGraph;
    storedGraph.lastAccessed = new Date().toISOString();
    storedGraph.accessCount++;

    await LocalStorage.setItem(`${STORAGE_KEYS.GRAPH_PREFIX}${id}`, JSON.stringify(storedGraph));
  } catch (error) {
    console.error(`Failed to update graph access for ${id}:`, error);
  }
}

/**
 * Check if a graph exists
 */
export async function graphExists(id: string): Promise<boolean> {
  const item = await LocalStorage.getItem<string>(`${STORAGE_KEYS.GRAPH_PREFIX}${id}`);
  return item !== undefined;
}

/**
 * Clear all graphs (use with caution!)
 */
export async function clearAllGraphs(): Promise<void> {
  const graphs = await listGraphs();

  for (const graph of graphs) {
    await LocalStorage.removeItem(`${STORAGE_KEYS.GRAPH_PREFIX}${graph.id}`);
  }

  await LocalStorage.removeItem(STORAGE_KEYS.GRAPHS);
}
