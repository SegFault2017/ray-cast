import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";
import { Tenant } from "../utils/types";

interface TenantFormValues {
  name: string;
  domain: string;
  clientId: string;
  clientSecret: string;
}

interface TenantFormProps {
  tenant?: Tenant;
  onSubmit: (values: TenantFormValues) => Promise<void>;
}

export default function TenantForm({ tenant, onSubmit }: TenantFormProps) {
  const { pop } = useNavigation();

  const { handleSubmit, itemProps } = useForm<TenantFormValues>({
    onSubmit: async (values) => {
      await onSubmit(values);
      pop();
    },
    initialValues: tenant
      ? { name: tenant.name, domain: tenant.domain, clientId: tenant.clientId, clientSecret: tenant.clientSecret }
      : undefined,
    validation: {
      name: FormValidation.Required,
      domain: FormValidation.Required,
      clientId: FormValidation.Required,
      clientSecret: FormValidation.Required,
    },
  });

  return (
    <Form
      navigationTitle={tenant ? `Edit ${tenant.name}` : "Add Tenant"}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={tenant ? "Update Tenant" : "Add Tenant"} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField title="Name" placeholder="e.g. Production" {...itemProps.name} />
      <Form.TextField title="Domain" placeholder="e.g. myapp.auth0.com" {...itemProps.domain} />
      <Form.TextField title="Client ID" placeholder="Machine-to-machine app Client ID" {...itemProps.clientId} />
      <Form.PasswordField
        title="Client Secret"
        placeholder="Machine-to-machine app Client Secret"
        {...itemProps.clientSecret}
      />
    </Form>
  );
}
