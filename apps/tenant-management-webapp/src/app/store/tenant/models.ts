export interface Role {
  id: string;
  name: string;
}

export interface Tenant {
  id: string;
  name: string;
  realm: string;
  adminEmail: string;
  isTenantAdmin: boolean;
  isTenantCreated: boolean;
  realmRoles: Role[];
}

export const TENANT_INIT: Tenant = {
  id: '',
  name: '',
  realm: '',
  adminEmail: '',
  isTenantAdmin: null,
  isTenantCreated: null,
  realmRoles: null,
};

export const CORE_TENANT = 'Platform';
