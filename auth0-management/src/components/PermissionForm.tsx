import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";

interface PermissionFormValues {
  value: string;
  description: string;
}

interface PermissionFormProps {
  scope?: { value: string; description?: string };
  onSubmit: (values: { value: string; description?: string }) => Promise<void>;
}

/** Form for adding or editing a scope (permission) on an Auth0 API. */
export default function PermissionForm({ scope, onSubmit }: PermissionFormProps) {
  const { pop } = useNavigation();
  const isEditing = !!scope;

  const { handleSubmit, itemProps } = useForm<PermissionFormValues>({
    onSubmit: async (values) => {
      await onSubmit({
        value: values.value,
        description: values.description || undefined,
      });
      pop();
    },
    initialValues: {
      value: scope?.value ?? "",
      description: scope?.description ?? "",
    },
    validation: {
      value: FormValidation.Required,
    },
  });

  return (
    <Form
      navigationTitle={isEditing ? `Edit ${scope.value}` : "Add Permission"}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={isEditing ? "Update Permission" : "Add Permission"} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        title="Scope Value"
        placeholder="e.g. read:users"
        info="The scope identifier (e.g. read:users)"
        {...itemProps.value}
        value={isEditing ? scope.value : itemProps.value.value}
        onChange={isEditing ? undefined : itemProps.value.onChange}
      />
      <Form.TextField title="Description" placeholder="e.g. Read user profiles" {...itemProps.description} />
    </Form>
  );
}
