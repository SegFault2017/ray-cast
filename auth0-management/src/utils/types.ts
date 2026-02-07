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
