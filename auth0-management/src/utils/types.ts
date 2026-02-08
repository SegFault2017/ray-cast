import { Color } from "@raycast/api";

export interface Identity {
  provider: string;
  user_id: string;
  connection: string;
  isSocial: boolean;
}

export interface User {
  user_id: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  identities?: Identity[];
  created_at: string;
  updated_at?: string;
  last_login?: string;
  last_ip?: string;
  logins_count?: number;
  blocked?: boolean;
}

export interface TenantConfig {
  name: string;
  domain: string;
  clientId: string;
  clientSecret: string;
}

export type Environment = "Dev" | "Staging" | "Prod";

export interface Tenant {
  id: string;
  name: string;
  environment: Environment;
  domain: string;
  clientId: string;
  clientSecret: string;
  color: Color;
}

export interface Organization {
  id: string;
  name: string;
  display_name?: string;
  branding?: {
    logo_url?: string;
    colors?: { primary?: string; page_background?: string };
  };
  metadata?: Record<string, string>;
}

export interface LogEntry {
  log_id?: string;
  date?: string;
  type?: string;
  description?: string;
  connection?: string;
  client_id?: string;
  client_name?: string;
  ip?: string;
  user_id?: string;
  user_name?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  location_info?: {
    country_name?: string;
    city_name?: string;
  };
}

export interface Session {
  id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  authenticated_at?: string;
  idle_expires_at?: string;
  expires_at?: string;
  last_interacted_at?: string;
  device?: {
    initial_user_agent?: string;
    initial_ip?: string | null;
    last_user_agent?: string;
    last_ip?: string | null;
  };
  clients?: Array<{ client_id?: string }>;
}

export interface UserGrant {
  id?: string;
  clientID?: string;
  user_id?: string;
  audience?: string;
  scope?: string[];
}
