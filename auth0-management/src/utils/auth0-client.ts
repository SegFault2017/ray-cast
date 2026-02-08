import { ManagementClient, ManagementError } from "auth0";
import { LogEntry, Organization, Session, TenantConfig, User, UserGrant } from "./types";

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

/**
 * Extract a user-friendly error message from Auth0 SDK errors.
 * For 403 errors, includes the required scope so users know what to grant.
 */
export function getAuth0ErrorMessage(err: unknown, requiredScope?: string): string {
  if (err instanceof ManagementError) {
    if (err.statusCode === 403 && requiredScope) {
      return `Forbidden: grant the "${requiredScope}" scope to your Auth0 application in the API settings`;
    }
    const body = err.body as { message?: string } | undefined;
    return body?.message || err.message || `Auth0 API error (${err.statusCode})`;
  }
  return err instanceof Error ? err.message : "Unknown error";
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

export async function getLogs(
  config: TenantConfig,
  options?: { search?: string; page?: number; per_page?: number; dateFrom?: Date; dateTo?: Date },
): Promise<LogEntry[]> {
  const client = getClient(config);

  // Build Lucene date range for the q parameter
  const from = options?.dateFrom?.toISOString() ?? "*";
  const to = options?.dateTo?.toISOString() ?? "*";
  const dateQuery = from !== "*" || to !== "*" ? `date:[${from} TO ${to}]` : undefined;

  const response = await client.logs.list(
    {
      search: options?.search || undefined,
      page: options?.page ?? 0,
      per_page: options?.per_page ?? 50,
      sort: "date:-1",
    },
    dateQuery ? { queryParams: { q: dateQuery } } : undefined,
  );
  return response.data as unknown as LogEntry[];
}

export async function testConnection(config: TenantConfig): Promise<{ friendly_name?: string }> {
  const client = getClient(config);
  const response = await client.tenants.settings.get({ fields: ["friendly_name"] });
  return response.data as unknown as { friendly_name?: string };
}

export async function getBlockedUsers(config: TenantConfig): Promise<User[]> {
  const client = getClient(config);
  const response = await client.users.list({
    q: "blocked:true",
    search_engine: "v3",
    per_page: 50,
    sort: "created_at:-1",
  });
  return response.data as unknown as User[];
}

export async function unblockUser(config: TenantConfig, userId: string): Promise<void> {
  const client = getClient(config);
  await client.users.update(userId, { blocked: false });
}

export async function getUserSessions(config: TenantConfig, userId: string): Promise<Session[]> {
  const client = getClient(config);
  const response = await client.users.sessions.list(userId, { take: 50 });
  return response.data as unknown as Session[];
}

export async function getUserGrants(config: TenantConfig, userId: string): Promise<UserGrant[]> {
  const client = getClient(config);
  const response = await client.userGrants.list({ user_id: userId });
  return response.data as unknown as UserGrant[];
}

export async function revokeUserSessions(config: TenantConfig, userId: string): Promise<void> {
  const client = getClient(config);
  await client.users.sessions.delete(userId);
}

export async function revokeGrant(config: TenantConfig, grantId: string): Promise<void> {
  const client = getClient(config);
  await client.userGrants.delete(grantId);
}
