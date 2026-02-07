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
  const trimmed = searchTerm.trim();

  if (!trimmed) {
    const response = await client.users.list({
      per_page: 20,
      sort: "created_at:-1",
    });
    return response.data as unknown as User[];
  }

  // Auth0 search engine v3 requires wildcard terms to be at least 3 characters
  if (trimmed.length < 3) {
    return [];
  }

  const query = `email:*${trimmed}* OR name:*${trimmed}*`;
  const response = await client.users.list({
    q: query,
    search_engine: "v3",
    per_page: 20,
  });
  return response.data as unknown as User[];
}

export async function getUserOrganizations(config: TenantConfig, userId: string): Promise<Organization[]> {
  const client = getClient(config);
  const response = await client.users.organizations.list(userId);
  return response.data as unknown as Organization[];
}

export async function listOrganizations(config: TenantConfig, take = 50): Promise<Organization[]> {
  const client = getClient(config);
  const response = await client.organizations.list({ take });
  return response.data as unknown as Organization[];
}

export async function getOrganizationMembers(config: TenantConfig, orgId: string): Promise<User[]> {
  const client = getClient(config);
  const response = await client.organizations.members.list(orgId, { take: 100 });
  return response.data as unknown as User[];
}

export async function addMembersToOrganization(config: TenantConfig, orgId: string, userIds: string[]): Promise<void> {
  const client = getClient(config);
  await client.organizations.members.create(orgId, { members: userIds });
}
