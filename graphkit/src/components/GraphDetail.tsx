import { Detail, ActionPanel, Action, showToast, Toast, Icon, confirmAlert, Alert, Clipboard } from "@raycast/api";
import { useEffect, useState } from "react";
import { loadGraph, deleteGraph } from "../lib/storage/graph-storage";
import { buildGraphFromData } from "../lib/graph/builder";
import { renderGraphASCII, renderMatrixASCII } from "../lib/visualization/ascii-renderer";
import { type GraphData } from "../lib/types/graph";

interface GraphDetailProps {
  graphId: string;
  onDelete?: () => void;
}

export function GraphDetail({ graphId, onDelete }: GraphDetailProps) {
  const [graphData, setGraphData] = useState<GraphData | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGraph() {
      try {
        const data = await loadGraph(graphId);
        setGraphData(data);
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to Load Graph",
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    }

    fetchGraph();
  }, [graphId]);

  async function handleDelete() {
    if (
      await confirmAlert({
        title: "Delete Graph",
        message: `Are you sure you want to delete "${graphData?.name}"?`,
        primaryAction: {
          title: "Delete",
          style: Alert.ActionStyle.Destructive,
        },
      })
    ) {
      try {
        await deleteGraph(graphId);
        await showToast({
          style: Toast.Style.Success,
          title: "Graph Deleted",
          message: `"${graphData?.name}" has been deleted`,
        });
        onDelete?.();
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to Delete Graph",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  async function handleCopyEdges() {
    if (!graphData) return;

    const graph = buildGraphFromData(graphData);
    const edges = graph.getEdges();
    const edgeStrings = edges.map((e) => {
      const connector = graphData.config.directed ? "->" : "-";
      const weight = e.weight !== undefined ? `:${e.weight}` : "";
      return `${e.from}${connector}${e.to}${weight}`;
    });

    const edgesText = edgeStrings.join(", ");

    await Clipboard.copy(edgesText);
    await showToast({
      style: Toast.Style.Success,
      title: "Copied to Clipboard",
      message: "Edge list copied",
    });
  }

  if (loading) {
    return <Detail isLoading={true} />;
  }

  if (!graphData) {
    return (
      <Detail
        markdown="# Graph Not Found\n\nThe requested graph could not be loaded."
        actions={
          <ActionPanel>
            <Action.Pop title="Go Back" />
          </ActionPanel>
        }
      />
    );
  }

  const graph = buildGraphFromData(graphData);
  const markdown = generateMarkdown(graphData, graph);

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Name" text={graphData.name} />
          {graphData.description && <Detail.Metadata.Label title="Description" text={graphData.description} />}
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label title="Nodes" text={String(graph.nodeCount)} icon={Icon.Circle} />
          <Detail.Metadata.Label title="Edges" text={String(graph.totalEdgeCount)} icon={Icon.Link} />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Type"
            text={graphData.config.directed ? "Directed" : "Undirected"}
            icon={graphData.config.directed ? Icon.ArrowRight : Icon.Minus}
          />
          <Detail.Metadata.Label
            title="Weighted"
            text={graphData.config.weighted ? "Yes" : "No"}
            icon={graphData.config.weighted ? Icon.Check : Icon.Xmark}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Created"
            text={new Date(graphData.createdAt).toLocaleDateString()}
          />
          <Detail.Metadata.Label
            title="Updated"
            text={new Date(graphData.updatedAt).toLocaleDateString()}
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Edges"
            content={graph.getEdges().map((e) => {
              const connector = graphData.config.directed ? "->" : "-";
              const weight = e.weight !== undefined ? `:${e.weight}` : "";
              return `${e.from}${connector}${e.to}${weight}`;
            }).join(", ")}
          />
          <Action.CopyToClipboard
            title="Copy Adjacency List"
            content={renderGraphASCII(graph)}
          />
          <Action
            title="Delete Graph"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={handleDelete}
            shortcut={{ modifiers: ["cmd"], key: "delete" }}
          />
        </ActionPanel>
      }
    />
  );
}

function generateMarkdown(graphData: GraphData, graph: ReturnType<typeof buildGraphFromData>): string {
  let markdown = `# ${graphData.name}\n\n`;

  if (graphData.description) {
    markdown += `${graphData.description}\n\n`;
  }

  markdown += "## Graph Structure\n\n";
  markdown += "```\n";
  markdown += renderGraphASCII(graph);
  markdown += "```\n\n";

  // Show adjacency matrix for small graphs
  if (graph.nodeCount <= 10) {
    markdown += "## Adjacency Matrix\n\n";
    markdown += "```\n";
    markdown += renderMatrixASCII(graph);
    markdown += "```\n\n";
  }

  // Show degree information
  markdown += "## Node Degrees\n\n";
  const nodes = graph.getNodes().sort();
  markdown += "| Node | Degree";
  if (graphData.config.directed) {
    markdown += " | In-Degree | Out-Degree";
  }
  markdown += " |\n";
  markdown += "|------|--------";
  if (graphData.config.directed) {
    markdown += "|-----------|------------";
  }
  markdown += "|\n";

  for (const node of nodes) {
    const degree = graph.getDegree(node);
    markdown += `| ${node} | ${degree.degree}`;
    if (graphData.config.directed) {
      markdown += ` | ${degree.inDegree} | ${degree.outDegree}`;
    }
    markdown += " |\n";
  }

  return markdown;
}
