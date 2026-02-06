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

export type TenantKey = "dev" | "staging" | "prod";

export interface Preferences {
  activeTenant: TenantKey;
  devDomain: string;
  devClientId: string;
  devClientSecret: string;
  stagingDomain: string;
  stagingClientId: string;
  stagingClientSecret: string;
  prodDomain: string;
  prodClientId: string;
  prodClientSecret: string;
}
