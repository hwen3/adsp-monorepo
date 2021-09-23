export interface ServiceUrls {
  serviceStatusApiUrl?: string;
}

export interface ConfigState {
  serviceUrls?: ServiceUrls;
  production?: boolean;
  envLoaded: boolean;
  platformTenantRealm?: string
}

export const CONFIG_INIT: ConfigState = { envLoaded: false };
