import { List, ActionPanel, Action, Detail, Icon } from "@raycast/api";
import { useState } from "react";
import { templates } from "./lib/graph/builder";
import { formatEdges } from "./lib/graph/parser";

type Category = "basics" | "algorithms" | "templates" | "formulas";

interface ReferenceItem {
  id: string;
  category: Category;
  title: string;
  subtitle: string;
  icon: string;
  content: string;
  copyContent?: string;
}

const referenceData: ReferenceItem[] = [
  // Basics
  {
    id: "graph-definition",
    category: "basics",
    title: "What is a Graph?",
    subtitle: "Basic definition and terminology",
    icon: Icon.Book,
    content: `# What is a Graph?

A **graph** is a mathematical structure consisting of vertices (nodes) and edges (connections between nodes).

## Formal Definition

A graph G = (V, E) consists of:
- **V**: A set of vertices (nodes)
- **E**: A set of edges connecting pairs of vertices

## Example

\`\`\`
Graph: G = (V, E)
V = {1, 2, 3, 4}
E = {(1,2), (2,3), (3,4), (4,1)}
\`\`\`

## Key Terminology

- **Vertex (Node)**: A fundamental unit in a graph
- **Edge**: A connection between two vertices
- **Adjacent**: Two vertices connected by an edge
- **Incident**: An edge is incident to the vertices it connects
- **Degree**: Number of edges connected to a vertex
`,
  },
  {
    id: "graph-types",
    category: "basics",
    title: "Types of Graphs",
    subtitle: "Directed, undirected, weighted, and more",
    icon: Icon.List,
    content: `# Types of Graphs

## By Direction

### Undirected Graph
Edges have no direction. If (u, v) exists, you can traverse from u to v AND from v to u.

\`\`\`
A --- B
|     |
C --- D
\`\`\`

### Directed Graph (Digraph)
Edges have direction. If (u → v) exists, you can only traverse from u to v.

\`\`\`
A --> B
|     ↓
↓     D
C <--/
\`\`\`

## By Weights

### Unweighted Graph
All edges have equal weight (or weight = 1)

### Weighted Graph
Edges have associated weights/costs

\`\`\`
A --5-- B
|       |
3       2
|       |
C --1-- D
\`\`\`

## Special Types

### Complete Graph (Kₙ)
Every pair of vertices is connected by an edge

### Bipartite Graph
Vertices can be divided into two disjoint sets where edges only connect vertices from different sets

### Tree
Connected acyclic graph (no cycles)

### Cycle
A path that starts and ends at the same vertex
`,
  },
  {
    id: "representations",
    category: "basics",
    title: "Graph Representations",
    subtitle: "Adjacency list vs adjacency matrix",
    icon: Icon.List,
    content: `# Graph Representations

## Adjacency List

Stores for each vertex a list of its adjacent vertices.

**Example:**
\`\`\`
1: [2, 4]
2: [1, 3]
3: [2, 4]
4: [1, 3]
\`\`\`

**Space Complexity:** O(V + E)
**Best for:** Sparse graphs (few edges)

## Adjacency Matrix

2D array where matrix[i][j] = 1 if edge exists, 0 otherwise.

**Example:**
\`\`\`
     1  2  3  4
  1  0  1  0  1
  2  1  0  1  0
  3  0  1  0  1
  4  1  0  1  0
\`\`\`

**Space Complexity:** O(V²)
**Best for:** Dense graphs, quick edge lookup

## GraphKit Uses

GraphKit uses **adjacency lists** for efficiency with sparse graphs, but can convert to adjacency matrix for algorithms that need it (like Floyd-Warshall).
`,
  },

  // Algorithms
  {
    id: "bfs-algorithm",
    category: "algorithms",
    title: "Breadth-First Search (BFS)",
    subtitle: "Level-by-level traversal",
    icon: Icon.Circle,
    content: `# Breadth-First Search (BFS)

## Overview

BFS explores a graph level by level, visiting all neighbors of a vertex before moving to the next level.

## Algorithm

1. Start at a source vertex
2. Mark it as visited and add to queue
3. While queue is not empty:
   - Dequeue a vertex
   - Visit all its unvisited neighbors
   - Mark them as visited and enqueue them

## Pseudocode

\`\`\`
BFS(graph, start):
  queue = [start]
  visited = {start}

  while queue is not empty:
    current = queue.dequeue()
    for each neighbor of current:
      if neighbor not in visited:
        visited.add(neighbor)
        queue.enqueue(neighbor)
\`\`\`

## Complexity

- **Time:** O(V + E) where V = vertices, E = edges
- **Space:** O(V) for queue and visited set

## Use Cases

- Finding shortest path in unweighted graphs
- Level-order traversal
- Testing bipartiteness
- Finding connected components
`,
  },
  {
    id: "dfs-algorithm",
    category: "algorithms",
    title: "Depth-First Search (DFS)",
    subtitle: "Go deep before going wide",
    icon: Icon.ArrowDown,
    content: `# Depth-First Search (DFS)

## Overview

DFS explores a graph by going as deep as possible along each branch before backtracking.

## Algorithm

1. Start at a source vertex
2. Mark it as visited
3. Recursively visit each unvisited neighbor
4. Backtrack when no unvisited neighbors remain

## Pseudocode

\`\`\`
DFS(graph, vertex, visited):
  visited.add(vertex)

  for each neighbor of vertex:
    if neighbor not in visited:
      DFS(graph, neighbor, visited)
\`\`\`

## Complexity

- **Time:** O(V + E)
- **Space:** O(V) for recursion stack

## Use Cases

- Topological sorting
- Detecting cycles
- Finding strongly connected components
- Path finding
- Maze solving
`,
  },
  {
    id: "dijkstra-algorithm",
    category: "algorithms",
    title: "Dijkstra's Algorithm",
    subtitle: "Shortest path for weighted graphs",
    icon: Icon.Pin,
    content: `# Dijkstra's Algorithm

## Overview

Finds the shortest path from a source vertex to all other vertices in a weighted graph with **non-negative** edge weights.

## Algorithm

1. Initialize distances to all vertices as ∞, except source (0)
2. Use a priority queue with source vertex
3. While queue is not empty:
   - Extract vertex with minimum distance
   - For each neighbor, relax the edge
   - Update distance if shorter path found

## Pseudocode

\`\`\`
Dijkstra(graph, source):
  dist[source] = 0
  dist[all others] = ∞
  pq = priority queue with (source, 0)

  while pq is not empty:
    u = pq.extract_min()
    for each neighbor v of u:
      if dist[u] + weight(u,v) < dist[v]:
        dist[v] = dist[u] + weight(u,v)
        pq.insert(v, dist[v])
\`\`\`

## Complexity

- **Time:** O((V + E) log V) with binary heap
- **Space:** O(V)

## Limitations

- **Cannot handle negative weights**
- Use Bellman-Ford for negative weights
`,
  },
  {
    id: "floyd-warshall-algorithm",
    category: "algorithms",
    title: "Floyd-Warshall Algorithm",
    subtitle: "All-pairs shortest paths",
    icon: Icon.Globe,
    content: `# Floyd-Warshall Algorithm

## Overview

Finds shortest paths between **all pairs** of vertices. Works with negative weights but not negative cycles.

## Algorithm

Uses dynamic programming with intermediate vertices.

## Pseudocode

\`\`\`
FloydWarshall(graph):
  dist = adjacency matrix

  for k from 1 to V:
    for i from 1 to V:
      for j from 1 to V:
        if dist[i][k] + dist[k][j] < dist[i][j]:
          dist[i][j] = dist[i][k] + dist[k][j]

  return dist
\`\`\`

## Complexity

- **Time:** O(V³)
- **Space:** O(V²)

## Use Cases

- Dense graphs where all-pairs paths needed
- Detecting negative cycles
- Transitive closure
`,
  },
  {
    id: "kruskal-algorithm",
    category: "algorithms",
    title: "Kruskal's Algorithm",
    subtitle: "Minimum spanning tree",
    icon: Icon.Tree,
    content: `# Kruskal's Algorithm

## Overview

Finds a minimum spanning tree (MST) for a weighted **undirected** graph by greedily selecting edges.

## Algorithm

1. Sort all edges by weight
2. Initialize Union-Find structure
3. For each edge in sorted order:
   - If edge connects two different components, add it to MST
   - Otherwise, skip it (would create cycle)

## Pseudocode

\`\`\`
Kruskal(graph):
  MST = empty
  sort edges by weight
  uf = Union-Find(vertices)

  for each edge (u, v, weight) in sorted edges:
    if uf.find(u) ≠ uf.find(v):
      MST.add((u, v, weight))
      uf.union(u, v)

  return MST
\`\`\`

## Complexity

- **Time:** O(E log E) due to sorting
- **Space:** O(V) for Union-Find

## Key Concept

Uses **Union-Find** data structure to efficiently detect cycles.
`,
  },
  {
    id: "prim-algorithm",
    category: "algorithms",
    title: "Prim's Algorithm",
    subtitle: "Minimum spanning tree",
    icon: Icon.Tree,
    content: `# Prim's Algorithm

## Overview

Finds MST by growing the tree from a starting vertex, always adding the minimum-weight edge that connects the tree to a new vertex.

## Algorithm

1. Start with arbitrary vertex in MST
2. Repeat until all vertices included:
   - Find minimum-weight edge connecting MST to new vertex
   - Add this edge and vertex to MST

## Pseudocode

\`\`\`
Prim(graph, start):
  MST = empty
  visited = {start}
  pq = edges from start

  while pq is not empty and |visited| < V:
    edge = pq.extract_min()
    if edge.to not in visited:
      MST.add(edge)
      visited.add(edge.to)
      pq.add_all(edges from edge.to)

  return MST
\`\`\`

## Complexity

- **Time:** O((V + E) log V) with binary heap
- **Space:** O(V)

## Comparison with Kruskal

- **Prim:** Better for dense graphs
- **Kruskal:** Better for sparse graphs
`,
  },

  // Templates
  {
    id: "complete-graph",
    category: "templates",
    title: "Complete Graph K₅",
    subtitle: "Every vertex connected to every other",
    icon: Icon.Circle,
    content: `# Complete Graph K₅

A complete graph where every pair of vertices is connected.

## Properties

- **Vertices:** 5
- **Edges:** 10 (maximum possible)
- **Degree of each vertex:** 4
- **Formula:** E = V(V-1)/2 for undirected complete graph

## Edge List

\`\`\`
1-2, 1-3, 1-4, 1-5,
2-3, 2-4, 2-5,
3-4, 3-5,
4-5
\`\`\`

Use "Copy Edge List" to paste into Create Graph!
`,
    copyContent: formatEdges(templates.complete(5).getEdges(), false),
  },
  {
    id: "cycle-graph",
    category: "templates",
    title: "Cycle Graph C₆",
    subtitle: "Vertices arranged in a cycle",
    icon: Icon.Circle,
    content: `# Cycle Graph C₆

A graph where vertices form a single cycle.

## Properties

- **Vertices:** 6
- **Edges:** 6
- **Degree of each vertex:** 2
- **Diameter:** 3

## Edge List

\`\`\`
1-2, 2-3, 3-4, 4-5, 5-6, 6-1
\`\`\`

Use "Copy Edge List" to paste into Create Graph!
`,
    copyContent: formatEdges(templates.cycle(6).getEdges(), false),
  },
  {
    id: "binary-tree",
    category: "templates",
    title: "Binary Tree (Depth 3)",
    subtitle: "Hierarchical tree structure",
    icon: Icon.Tree,
    content: `# Binary Tree (Depth 3)

A tree where each node has at most two children.

## Properties

- **Depth:** 3
- **Vertices:** 15 (2⁴ - 1)
- **Edges:** 14
- **Leaves:** 8

## Structure

\`\`\`
        1
       / \\
      2   3
     / \\ / \\
    4 5 6 7
   /\\ /\\ /\\ /\\
  ...........
\`\`\`

Use "Copy Edge List" to paste into Create Graph!
`,
    copyContent: formatEdges(templates.binaryTree(3).getEdges(), false),
  },
  {
    id: "bipartite-graph",
    category: "templates",
    title: "Bipartite Graph K₃,₃",
    subtitle: "Two disjoint sets with cross connections",
    icon: Icon.TwoPeople,
    content: `# Bipartite Graph K₃,₃

Complete bipartite graph with 3 vertices in each partition.

## Properties

- **Vertices:** 6 (3 + 3)
- **Edges:** 9 (3 × 3)
- **Is bipartite:** Yes
- **Partitions:** {A1, A2, A3} and {B1, B2, B3}

## Edge List

\`\`\`
A1-B1, A1-B2, A1-B3,
A2-B1, A2-B2, A2-B3,
A3-B1, A3-B2, A3-B3
\`\`\`

Use "Copy Edge List" to paste into Create Graph!
`,
    copyContent: formatEdges(templates.bipartite(3, 3).getEdges(), false),
  },

  // Formulas
  {
    id: "handshaking-lemma",
    category: "formulas",
    title: "Handshaking Lemma",
    subtitle: "Sum of degrees equals twice the edges",
    icon: Icon.Calculator,
    content: `# Handshaking Lemma

## Theorem

In any undirected graph, the sum of all vertex degrees equals twice the number of edges.

## Formula

\`\`\`
∑ deg(v) = 2|E|
\`\`\`

Where:
- deg(v) = degree of vertex v
- |E| = number of edges

## Intuition

Each edge contributes to the degree of **two** vertices (its endpoints).

## Corollary

The number of vertices with odd degree is always **even**.

## Example

Graph: 1-2, 2-3, 3-1

Degrees: deg(1)=2, deg(2)=2, deg(3)=2
Sum = 6 = 2 × 3 edges ✓
`,
  },
  {
    id: "graph-density",
    category: "formulas",
    title: "Graph Density",
    subtitle: "How close to complete is the graph",
    icon: Icon.BarChart,
    content: `# Graph Density

## Formula

### Undirected Graph
\`\`\`
D = 2|E| / (|V|(|V|-1))
\`\`\`

### Directed Graph
\`\`\`
D = |E| / (|V|(|V|-1))
\`\`\`

Where:
- |E| = number of edges
- |V| = number of vertices

## Range

- **Minimum:** 0 (no edges)
- **Maximum:** 1 (complete graph)

## Interpretation

- **Sparse graph:** D close to 0
- **Dense graph:** D close to 1

## Example

Graph with 5 vertices, 6 edges:
D = 2×6 / (5×4) = 12/20 = 0.6
`,
  },
  {
    id: "tree-properties",
    category: "formulas",
    title: "Tree Properties",
    subtitle: "Key formulas for trees",
    icon: Icon.Tree,
    content: `# Tree Properties

## Definition

A tree is a connected acyclic graph.

## Key Properties

### Edge Count
\`\`\`
|E| = |V| - 1
\`\`\`
A tree with V vertices has exactly V-1 edges.

### Path Uniqueness
There exists exactly **one path** between any two vertices.

### Adding an Edge
Adding any edge to a tree creates exactly **one cycle**.

### Minimum Connected
Removing any edge **disconnects** the tree.

## Binary Tree Height

For a binary tree with n nodes:
- **Minimum height:** ⌈log₂(n+1)⌉ - 1 (complete)
- **Maximum height:** n - 1 (skewed)

## Example

Tree with 10 vertices:
- Edges: 9
- Paths between any two vertices: 1
- Is connected: Yes
- Has cycles: No
`,
  },
];

export default function Command() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");

  const categories = [
    { value: "all" as const, title: "All Topics", icon: Icon.Book },
    { value: "basics" as const, title: "Graph Basics", icon: Icon.Book },
    { value: "algorithms" as const, title: "Algorithms", icon: Icon.Code },
    { value: "templates" as const, title: "Graph Templates", icon: Icon.Document },
    { value: "formulas" as const, title: "Formulas & Properties", icon: Icon.Calculator },
  ];

  const filteredData =
    selectedCategory === "all" ? referenceData : referenceData.filter((item) => item.category === selectedCategory);

  return (
    <List
      searchBarPlaceholder="Search graph theory topics..."
      searchBarAccessory={
        <List.Dropdown tooltip="Filter by Category" value={selectedCategory} onChange={(value) => setSelectedCategory(value as Category | "all")}>
          {categories.map((cat) => (
            <List.Dropdown.Item key={cat.value} value={cat.value} title={cat.title} icon={cat.icon} />
          ))}
        </List.Dropdown>
      }
    >
      {filteredData.map((item) => (
        <List.Item
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          accessories={[{ tag: item.category }]}
          actions={
            <ActionPanel>
              <Action.Push title="View Details" target={<ReferenceDetail item={item} />} />
              {item.copyContent && (
                <Action.CopyToClipboard title="Copy Edge List" content={item.copyContent} shortcut={{ modifiers: ["cmd"], key: "c" }} />
              )}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function ReferenceDetail({ item }: { item: ReferenceItem }) {
  return (
    <Detail
      markdown={item.content}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Content" content={item.content} />
          {item.copyContent && <Action.CopyToClipboard title="Copy Edge List" content={item.copyContent} shortcut={{ modifiers: ["cmd"], key: "e" }} />}
        </ActionPanel>
      }
    />
  );
}
