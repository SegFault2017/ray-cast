# Auth0 Management Raycast Extension - Specification

## Goal

Create a Raycast extension for managing Auth0 users across multiple tenants. The extension should allow searching users by name/email, viewing user details, copying user IDs, and switching between different Auth0 tenants (dev, staging, production).

## Project Setup

1. Initialize a new Raycast extension project named "auth0-management"
2. Set up TypeScript with proper types
3. Install required dependencies:
   - @raycast/api (comes with template)
   - node-fetch or axios for HTTP requests
   - Any other utilities needed

## Core Requirements

### Multi-Tenant Support
- Support 3 tenants: Development, Staging, Production
- Store credentials securely using Raycast password-type preferences
- Allow switching between tenants via dropdown preference and dedicated command
- Each tenant has: domain, client ID, client secret
- Display active tenant name in UI

### Auth0 API Integration
- Use Auth0 Management API v2
- Implement OAuth2 client credentials flow for authentication
- Cache access tokens (they're valid for 24 hours) to avoid repeated auth requests
- Required API scopes: `read:users`, `read:logs`, `read:user_idp_tokens`
- Handle token expiration and re-authentication

## Commands to Implement

### 1. search-users (Primary Command)
- Interactive list view with search
- Search Auth0 users by name, email, or user ID using query: `email:*${term}* OR name:*${term}*`
- Display: email (title), name (subtitle), user_id and last_login (accessories)
- Actions: Copy user ID, Copy email, View full details, Open in Auth0 dashboard
- Detail view shows: user_id, email, name, identities, created_at, last_login, logins_count

### 2. switch-tenant
- List view showing all 3 configured tenants
- Indicate which tenant is currently active
- Action: Switch to selected tenant (update preference)
- Show tenant domain and configured status

### 3. view-recent-logins
- List view of recent successful login events from Auth0 logs
- Use logs API with type filter: `type:s` (successful login)
- Display: user email, IP address, timestamp, application
- Actions: Copy user ID, View user details

### 4. view-failed-logins
- List view of recent failed login attempts
- Use logs API with type filter: `type:f` (failed login)
- Display: attempted email/username, failure reason, IP, timestamp
- Helps with security monitoring

### 5. quick-user-lookup
- No-view command (runs in background)
- Takes email as argument
- Searches for user, copies user_id to clipboard
- Shows toast notification with result

### 6. view-blocked-users
- List view filtered for blocked users
- Search with query: `blocked:true`
- Display blocked users with block reason and date

### 7. copy-tenant-info
- No-view command
- Quickly copies current tenant domain to clipboard
- Shows toast with copied value

## File Structure

```
auth0-management/
├── package.json
├── tsconfig.json
├── assets/
│   └── command-icon.png
├── src/
│   ├── search-users.tsx
│   ├── switch-tenant.tsx
│   ├── view-recent-logins.tsx
│   ├── view-failed-logins.tsx
│   ├── quick-user-lookup.tsx
│   ├── view-blocked-users.tsx
│   ├── copy-tenant-info.tsx
│   ├── components/
│   │   ├── UserListItem.tsx
│   │   ├── UserDetail.tsx
│   │   └── LogListItem.tsx
│   └── utils/
│       ├── auth0-client.ts     (API client with auth)
│       ├── preferences.ts       (Helper to get active tenant config)
│       └── types.ts             (TypeScript interfaces)
└── README.md
```

## Technical Implementation Details

### Preferences (package.json)

```json
{
  "preferences": [
    {
      "name": "activeTenant",
      "type": "dropdown",
      "required": true,
      "title": "Active Tenant",
      "default": "dev",
      "data": [
        { "title": "Development", "value": "dev" },
        { "title": "Staging", "value": "staging" },
        { "title": "Production", "value": "prod" }
      ]
    },
    {
      "name": "devDomain",
      "type": "textfield",
      "title": "Dev Domain",
      "placeholder": "dev.auth0.com"
    },
    {
      "name": "devClientId",
      "type": "textfield",
      "title": "Dev Client ID"
    },
    {
      "name": "devClientSecret",
      "type": "password",
      "title": "Dev Client Secret"
    }
    // Repeat for staging and prod
  ]
}
```

### Auth0 Client Utility (utils/auth0-client.ts)

The client should:
- Get access token using client credentials flow:
```typescript
POST https://{domain}/oauth/token
{
  "client_id": clientId,
  "client_secret": clientSecret,
  "audience": "https://{domain}/api/v2/",
  "grant_type": "client_credentials"
}
```
- Cache tokens with expiration tracking
- Provide methods:
  - `searchUsers(query: string): Promise<User[]>`
  - `getUser(userId: string): Promise<User>`
  - `getLogs(filter: string): Promise<Log[]>`
  - `getBlockedUsers(): Promise<User[]>`

### Preferences Helper (utils/preferences.ts)

```typescript
interface TenantConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
}

function getActiveTenantConfig(): TenantConfig {
  // Read activeTenant preference
  // Return the corresponding domain/clientId/clientSecret
  // Validate that required fields are configured
}
```

### TypeScript Types (utils/types.ts)

```typescript
interface User {
  user_id: string;
  email: string;
  name: string;
  identities: Identity[];
  created_at: string;
  last_login?: string;
  logins_count: number;
  blocked?: boolean;
}

interface Identity {
  provider: string;
  user_id: string;
  connection: string;
  isSocial: boolean;
}

interface Log {
  log_id: string;
  type: string;
  date: string;
  user_id?: string;
  user_name?: string;
  client_name?: string;
  ip: string;
  description?: string;
}
```

### Search Users Command Example (src/search-users.tsx)

```typescript
import { List, ActionPanel, Action, getPreferenceValues } from "@raycast/api";
import { useState, useEffect } from "react";
import { searchUsers } from "./utils/auth0-client";
import UserDetail from "./components/UserDetail";

export default function SearchUsers() {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Debounced search logic
    // Call searchUsers API when searchText changes
  }, [searchText]);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search by name, email, or user ID..."
      navigationTitle="Search Users"
    >
      {users.map((user) => (
        <List.Item
          key={user.user_id}
          title={user.email}
          subtitle={user.name}
          accessories={[
            { text: user.user_id },
            { tag: user.last_login ? "Active" : "Inactive" }
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Details"
                target={<UserDetail user={user} />}
              />
              <Action.CopyToClipboard
                title="Copy User ID"
                content={user.user_id}
              />
              <Action.CopyToClipboard
                title="Copy Email"
                content={user.email}
              />
              <Action.OpenInBrowser
                title="Open in Auth0 Dashboard"
                url={`https://${domain}/dashboard/#/users/${user.user_id}`}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
```

## API Endpoints

- **Get Access Token**: `POST https://{domain}/oauth/token`
- **Search Users**: `GET https://{domain}/api/v2/users?q={query}&search_engine=v3`
- **Get User**: `GET https://{domain}/api/v2/users/{id}`
- **Get Logs**: `GET https://{domain}/api/v2/logs?q=type:{type}`

## Error Handling

- Check if tenant credentials are configured before making API calls
- Show toast notifications for errors
- Handle API rate limits gracefully
- Validate access token expiration
- Provide helpful error messages (e.g., "Please configure Dev tenant in preferences")

## UI/UX Requirements

- Show active tenant name in navigation subtitle or as a tag
- Use loading states while fetching data
- Show empty states with helpful messages
- Use appropriate icons for different log types
- Format dates in human-readable format
- Color-code different tenant environments (dev/staging/prod)

## Testing Checklist

1. Test with missing tenant configurations
2. Test search with various queries
3. Test tenant switching
4. Test all copy actions
5. Test opening Auth0 dashboard links
6. Test error scenarios (invalid credentials, network errors)
7. Verify password fields are stored securely
8. Test token caching and expiration

## Documentation (README.md)

Include:
- Setup instructions (how to create M2M app in Auth0)
- Required Auth0 API scopes
- How to configure tenants
- Command descriptions
- Screenshots of main commands

## Important Notes

- Client secrets must use `"type": "password"` in preferences for secure storage
- User ID field (`user_id`) is what you use as the OpenID Connect `sub` claim
- Auth0 search uses Lucene query syntax
- Access tokens are valid for 24 hours - implement caching
- Always validate tenant configuration exists before API calls

## Getting Started

1. Create the basic extension structure with `npm create raycast-extension`
2. Implement the preferences and tenant switching logic first
3. Build the Auth0 client utility with authentication
4. Implement search-users command as the MVP
5. Add remaining commands incrementally
6. Test thoroughly with all three tenants
