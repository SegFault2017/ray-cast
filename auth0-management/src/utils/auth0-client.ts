import { ManagementClient } from "auth0";
import { Organization, TenantConfig, User } from "./types";

// Cache ManagementClient instances per domain (SDK handles token management)
const clientCache: Map<string, ManagementClient> = new Map();

function getClient(config: TenantConfig): ManagementClient {
  const cached = clientCache.get(config.domain);
  if (cached) return cached;

  const client = new ManagementClient({
    domain: config.domain,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });

  clientCache.set(config.domain, client);
  return client;
}

export async function searchUsers(config: TenantConfig, searchTerm: string): Promise<User[]> {
  const client = getClient(config);

  if (!searchTerm.trim()) {
    const response = await client.users.list({
      per_page: 20,
      sort: "created_at:-1",
    });
    return response.data as unknown as User[];
  }

  const query = `email:*${searchTerm}* OR name:*${searchTerm}*`;
  const response = await client.users.list({
    q: query,
    search_engine: "v3",
    per_page: 20,
  });
  return response.data as unknown as User[];
}

export async function listOrganizations(config: TenantConfig, take = 50): Promise<Organization[]> {
  const client = getClient(config);
  const response = await client.organizations.list({ take });
  return response.data as unknown as Organization[];
}
