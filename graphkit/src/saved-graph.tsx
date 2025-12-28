import { List, ActionPanel, Action, Icon, confirmAlert, Alert, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { useFrecencySorting } from "@raycast/utils";
import { listGraphs, deleteGraph } from "./lib/storage/graph-storage";
import { GraphDetail } from "./components/GraphDetail";
import { type StoredGraph } from "./lib/types/storage";

export default function Command() {
  const [graphs, setGraphs] = useState<StoredGraph[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: sortedGraphs, visitItem } = useFrecencySorting(graphs, {
    key: (graph) => graph.id,
  });

  useEffect(() => {
    loadGraphs();
  }, []);

  async function loadGraphs() {
    try {
      const allGraphs = await listGraphs();
      setGraphs(allGraphs);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Load Graphs",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(graph: StoredGraph) {
    if (
      await confirmAlert({
        title: "Delete Graph",
        message: `Are you sure you want to delete "${graph.data.name}"?`,
        primaryAction: {
          title: "Delete",
          style: Alert.ActionStyle.Destructive,
        },
      })
    ) {
      try {
        await deleteGraph(graph.id);
        await showToast({
          style: Toast.Style.Success,
          title: "Graph Deleted",
          message: `"${graph.data.name}" has been deleted`,
        });
        await loadGraphs();
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to Delete Graph",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  async function handleDuplicate(_graph: StoredGraph) {
    // Implementation for duplicating a graph would go here
    await showToast({
      style: Toast.Style.Animated,
      title: "Coming Soon",
      message: "Graph duplication will be available soon",
    });
  }

  function handleViewDetails(graph: StoredGraph) {
    visitItem(graph);
    return <GraphDetail graphId={graph.id} onDelete={loadGraphs} />;
  }

  return (
    <List isLoading={loading} searchBarPlaceholder="Search graphs...">
      {sortedGraphs.length === 0 && !loading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No Graphs Yet"
          description="Create your first graph using the Create Graph command"
        />
      ) : (
        sortedGraphs.map((graph) => (
          <List.Item
            key={graph.id}
            icon={graph.data.config.directed ? Icon.ArrowRight : Icon.Circle}
            title={graph.data.name}
            subtitle={graph.data.description}
            accessories={[
              {
                text: `${graph.data.nodes.length} nodes`,
                icon: Icon.Circle,
              },
              {
                text: `${graph.data.edges.length} edges`,
                icon: Icon.Link,
              },
              {
                date: new Date(graph.lastAccessed),
                tooltip: `Last accessed: ${new Date(graph.lastAccessed).toLocaleString()}`,
              },
            ]}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Details"
                  icon={Icon.Eye}
                  target={handleViewDetails(graph)}
                />
                <Action.CopyToClipboard
                  title="Copy Edges"
                  icon={Icon.Clipboard}
                  content={graph.data.edges
                    .map((e) => {
                      const connector = graph.data.config.directed ? "->" : "-";
                      const weight = e.weight !== undefined ? `:${e.weight}` : "";
                      return `${e.from}${connector}${e.to}${weight}`;
                    })
                    .join(", ")}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <ActionPanel.Section>
                  <Action
                    title="Duplicate Graph"
                    icon={Icon.Duplicate}
                    onAction={() => handleDuplicate(graph)}
                    shortcut={{ modifiers: ["cmd"], key: "d" }}
                  />
                  <Action
                    title="Delete Graph"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    onAction={() => handleDelete(graph)}
                    shortcut={{ modifiers: ["ctrl"], key: "x" }}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <Action
                    title="Refresh List"
                    icon={Icon.ArrowClockwise}
                    onAction={loadGraphs}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
