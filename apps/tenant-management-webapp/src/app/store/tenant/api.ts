import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Tenant } from './models';
import { TenantApi as TenantApiConfig } from '@store/config/models';

export class TenantApi {
  private http: AxiosInstance;
  private config: TenantApiConfig;
  constructor(config: TenantApiConfig, token: string) {
    if (!token) {
      throw new Error('missing auth token = tenant api');
    }

    this.http = axios.create({ baseURL: config.host });
    this.config = config;
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${token}`;
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
      return req;
    });
  }

  async fetchTenantByRealm(realm: string): Promise<Tenant> {
    const url = `${this.config.host}${this.config.endpoints.tenantNameByRealm}/${realm}`;
    const res = await this.http.get(url);
    return res.data;
  }

  async createTenant(name: string): Promise<Tenant> {
    const url = `${this.config.host}${this.config.endpoints.createTenant}`;
    const res = await this.http.post(url, {
      tenantName: name,
      realm: name,
    });
    return res.data;
  }

  async fetchTenantByEmail(email: string): Promise<Tenant> {
    const url = `${this.config.host}${this.config.endpoints.tenantByEmail}`;
    const res = await this.http.post(url, { email });
    return res.data;
  }
}
