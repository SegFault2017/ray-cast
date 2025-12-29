import { Detail, ActionPanel, Action, showToast, Toast, Icon, confirmAlert, Alert } from "@raycast/api";
import { useEffect, useState } from "react";
import { loadGraph, deleteGraph } from "../lib/storage/graph-storage";
import { buildGraphFromData } from "../lib/graph/builder";
import {  renderMatrixASCII } from "../lib/visualization/ascii-renderer";
import { generateGraphImage, getGraphvizInstallInstructions } from "../lib/visualization/graphviz";
import { type GraphData } from "../lib/types/graph";

interface GraphDetailProps {
  graphId: string;
  onDelete?: () => void;
}

export function GraphDetail({ graphId, onDelete }: GraphDetailProps) {
  const [graphData, setGraphData] = useState<GraphData | undefined>();
  const [loading, setLoading] = useState(true);
  const [imagePath, setImagePath] = useState<string | undefined>();
  const [graphvizError, setGraphvizError] = useState<string | undefined>();

  useEffect(() => {
    async function fetchGraph() {
      try {
        const data = await loadGraph(graphId);
        setGraphData(data);

        // Generate visualization
        if (data) {
          const graph = buildGraphFromData(data);
          const result = await generateGraphImage(graph, {
            layout: graph.nodeCount > 20 ? "sfdp" : "dot",
            showWeights: data.config.weighted,
          });

          if (result.success && result.imagePath) {
            setImagePath(result.imagePath);
          } else if (result.error) {
            setGraphvizError(result.error);
          }
        }
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

  if (loading) {
    return <Detail isLoading={true} />;
  }

  if (!graphData) {
    return <Detail markdown="# Graph Not Found\n\nThe requested graph could not be loaded." />;
  }

  const graph = buildGraphFromData(graphData);
  const markdown = generateMarkdown(graphData, graph, imagePath, graphvizError);

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
          <Action
            title="Delete Graph"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={handleDelete}
            shortcut={{ modifiers: ["ctrl"], key: "d" }}
          />
        </ActionPanel>
      }
    />
  );
}

function generateMarkdown(
  graphData: GraphData,
  graph: ReturnType<typeof buildGraphFromData>,
  imagePath?: string,
  graphvizError?: string,
): string {
  let markdown = `# ${graphData.name}\n\n`;

  if (graphData.description) {
    markdown += `${graphData.description}\n\n`;
  }

  // Show visual graph if available
  if (imagePath) {
    markdown += "## Graph Visualization\n\n";
    markdown += `![Graph](file://${imagePath})\n\n`;
  } else if (graphvizError) {
    markdown += "## Visualization\n\n";
    markdown += `⚠️ ${graphvizError}\n\n`;
    markdown += getGraphvizInstallInstructions() + "\n\n";
  }

  markdown += "## Graph Structure\n\n";
  // markdown += "```\n";
  // markdown += renderGraphASCII(graph);
  // markdown += "```\n\n";

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
