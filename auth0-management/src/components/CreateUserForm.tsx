import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { useForm, FormValidation, usePromise } from "@raycast/utils";
import { useState } from "react";
import { listConnections } from "../utils/auth0-client";
import { TenantConfig } from "../utils/types";

interface CreateUserFormValues {
  email: string;
  connection: string;
}

interface CreateUserFormProps {
  tenant: TenantConfig;
  onSubmit: (values: { email: string; password: string; connection: string }) => Promise<void>;
}

/** Form for creating a new Auth0 user on a database connection. */
export default function CreateUserForm({ tenant, onSubmit }: CreateUserFormProps) {
  const { pop } = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const { data: connections, isLoading } = usePromise(() => listConnections(tenant));

  const { handleSubmit, itemProps } = useForm<CreateUserFormValues>({
    onSubmit: async (values) => {
      if (!password) {
        setPasswordError("Required");
        return;
      }
      await onSubmit({ ...values, password });
      pop();
    },
    initialValues: {
      connection: "Username-Password-Authentication",
    },
    validation: {
      email: FormValidation.Required,
      connection: FormValidation.Required,
    },
  });

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Create User"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create User" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField title="Email" placeholder="user@example.com" {...itemProps.email} />
      <Form.PasswordField
        id="password"
        title="Password"
        placeholder="Enter a password"
        value={password}
        error={passwordError}
        onChange={(value) => {
          setPassword(value);
          setPasswordError(undefined);
        }}
        onBlur={() => {
          if (!password) setPasswordError("Required");
        }}
      />
      <Form.Checkbox id="showPassword" label="Show Password" value={showPassword} onChange={setShowPassword} />
      {showPassword && <Form.Description title="" text={password || "No password entered"} />}
      <Form.Dropdown title="Connection" {...itemProps.connection}>
        {(connections ?? []).map((conn) => (
          <Form.Dropdown.Item key={conn.name} value={conn.name} title={conn.name} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
