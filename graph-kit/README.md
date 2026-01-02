# GraphKit

A powerful graph analysis and visualization extension for Raycast. Create, analyze, and visualize graphs with interactive step-by-step algorithm execution.

## Features

### 📊 Graph Creation
- **Flexible Edge Input**: Create graphs using multiple notation formats
  - Undirected: `1-2, 2-3, 3-4`
  - Directed: `1->2, 2->3, 3->4`
  - Weighted: `1-2:5, 2->3:3.5`
- **Graph Types**: Support for directed/undirected and weighted/unweighted graphs
- **Quick Creation**: Simple form-based interface for rapid graph construction

### 🎯 Algorithm Library

**Traversal Algorithms**
- Breadth-First Search (BFS)
- Depth-First Search (DFS)

**Shortest Path Algorithms**
- Dijkstra's Algorithm (single-source shortest path)
- Floyd-Warshall Algorithm (all-pairs shortest path)

**Spanning Tree Algorithms**
- Kruskal's Algorithm (minimum spanning tree)
- Prim's Algorithm (minimum spanning tree)

**Graph Analysis**
- Connected Components
- Graph Properties (complete, cycle, path, star, tree, bipartite, regular)
- Graph Metrics (density, diameter, degree distribution)
- Hamiltonian Cycle Analysis

### 🎬 Interactive Step-by-Step Visualization

Experience algorithms in action with our interactive stepper:
- **Visual Graph Updates**: See the graph change at each algorithm step
- **Color-Coded Nodes**:
  - 🟠 Orange: Current node being processed
  - 🟢 Green: Visited nodes
  - ⚪ Gray: Unvisited nodes
- **Algorithm State**: View queues, stacks, distances, and other algorithm-specific data
- **Keyboard Navigation**: Use Cmd+Arrow keys to step through execution
- **Progress Tracking**: See percentage completion and step count

### 📈 Visualization

- **Graphviz Integration**: High-quality SVG graph rendering powered by @hpcc-js/wasm
- **Multiple Layouts**: Choose from dot, neato, fdp, circo, twopi, and sfdp layouts
- **ASCII Fallback**: Text-based visualization when Graphviz is unavailable
- **Dynamic Updates**: Real-time visualization updates during algorithm execution

### 💾 Graph Management

- **Persistent Storage**: Save graphs locally using Raycast's LocalStorage
- **Graph Library**: Access and manage all your saved graphs
- **Metadata Tracking**: Automatic tracking of access count and last accessed time
- **Quick Actions**: Fast access to common operations (analyze, visualize, delete)

## Usage

### Creating a Graph

1. Open Raycast and type "Create Graph"
2. Enter a name and optional description
3. Select graph type (directed/undirected, weighted/unweighted)
4. Input edges in any supported format:
   ```
   1-2, 2-3, 3-4, 4-1
   ```
   or for weighted graphs:
   ```
   A->B:5, B->C:3, C->A:2
   ```
5. Submit to create and visualize your graph

### Analyzing a Graph

1. Open Raycast and type "Analyze Graph"
2. Select a graph from your library
3. Choose from quick actions:
   - **Diagnose Graph**: Check graph properties and classification
   - **Graph Metrics**: View statistics and degree distribution
   - **Algorithms**: Access full algorithm library
4. For algorithms requiring parameters:
   - Select start node (and end node for Dijkstra)
   - Choose "Run Algorithm" for instant results
   - Choose "View Step-By-Step" for interactive visualization

### Step-by-Step Visualization

1. Select an algorithm that supports steps
2. Press `Cmd+S` or select "View Step-By-Step"
3. Configure parameters (start node, etc.)
4. Click "Start Stepper"
5. Navigate through steps:
   - `Cmd+→`: Next step
   - `Cmd+←`: Previous step
   - `Cmd+Shift+→`: Jump to last step
   - `Cmd+Shift+←`: Jump to first step

## Keyboard Shortcuts

- `Cmd+V`: View graph details & visualization
- `Cmd+M`: Access algorithms menu
- `Cmd+S`: Start step-by-step visualization
- `Ctrl+D`: Delete graph
- `Cmd+→/←`: Navigate algorithm steps

## Technical Details

- **Built with**: TypeScript, React, Raycast API
- **Visualization**: Graphviz WASM (@hpcc-js/wasm)
- **Graph Representation**: Adjacency list for efficient operations
- **Storage**: Raycast LocalStorage API
- **Node Version**: Requires Node.js >= 18.0.0

## Development

```bash
# Install dependencies
npm install

# Development mode with live reload
ray develop

# Build extension
ray build

# Lint code
ray lint

# Fix linting issues
ray lint --fix
```

## Examples

### Create a Simple Network
```
A-B, B-C, C-D, D-A, A-C
```

### Create a Weighted Directed Graph
```
1->2:10, 2->3:20, 3->4:15, 4->1:5, 1->3:25
```

### Analyze Path Finding
1. Create a weighted graph
2. Select Dijkstra's algorithm
3. Choose start and end nodes
4. View the shortest path with distances

### Visualize BFS Traversal
1. Create any graph
2. Select BFS algorithm
3. Choose "View Step-By-Step"
4. Watch the breadth-first traversal unfold node by node

## License

MIT