import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { buildGraphFromEdges, graphToData } from "./lib/graph/builder";
import { saveGraph } from "./lib/storage/graph-storage";
import { GraphDetail } from "./components/GraphDetail";

function generateId(): string {
  return `graph_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface FormValues {
  name: string;
  description: string;
  graphType: string;
  edges: string;
  weighted: boolean;
}

export default function Command() {
  const [edgesError, setEdgesError] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const { push } = useNavigation();

  async function handleSubmit(values: FormValues) {
    // Validate name
    if (!values.name.trim()) {
      setNameError("Graph name is required");
      return;
    }

    // Validate edges
    if (!values.edges.trim()) {
      setEdgesError("At least one edge is required");
      return;
    }

    const directed = values.graphType === "directed";
    const weighted = values.weighted;

    // Parse edges and build graph
    const { graph, errors, warnings } = buildGraphFromEdges(values.edges, directed, weighted);

    if (errors.length > 0) {
      setEdgesError(errors.join("\n"));
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid Edge Format",
        message: errors[0],
      });
      return;
    }

    // Show warnings if any
    if (warnings.length > 0) {
      await showToast({
        style: Toast.Style.Animated,
        title: "Warning",
        message: warnings[0],
      });
    }

    // Create graph data
    const graphData = graphToData(graph, generateId(), values.name.trim(), values.description?.trim() || undefined);

    try {
      // Save graph
      await saveGraph(graphData);

      await showToast({
        style: Toast.Style.Success,
        title: "Graph Created",
        message: `"${values.name}" has been saved`,
      });

      // Navigate to graph detail view
      push(<GraphDetail graphId={graphData.id} />);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Save Graph",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  function handleEdgesChange(value: string) {
    void value; // Explicitly ignore parameter
    setEdgesError(undefined);
  }

  function handleNameChange(value: string) {
    void value; // Explicitly ignore parameter
    setNameError(undefined);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Graph" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Create a new graph by entering edges." />

      <Form.TextField
        id="name"
        title="Graph Name"
        placeholder="My Graph"
        error={nameError}
        onChange={handleNameChange}
      />

      <Form.TextField id="description" title="Description" placeholder="Optional description of your graph" />

      <Form.Separator />

      <Form.Dropdown id="graphType" title="Graph Type" defaultValue="undirected">
        <Form.Dropdown.Item value="undirected" title="Undirected" />
        <Form.Dropdown.Item value="directed" title="Directed" />
      </Form.Dropdown>

      <Form.Checkbox id="weighted" title="Weighted Graph" label="Graph has weighted edges" />

      <Form.Separator />

      <Form.TextArea
        id="edges"
        title="Edges"
        placeholder="1-2, 2-3, 3-4, 4-1 or 1->2:5, 2->3:3 (for directed weighted)"
        error={edgesError}
        onChange={handleEdgesChange}
        info="Enter edges in format: 1-2 (undirected), 1->2 (directed), 1-2:5 (weighted)"
      />
    </Form>
  );
}
