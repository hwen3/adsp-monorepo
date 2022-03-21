import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Directory, Service } from './models';
import { TenantApi as TenantApiConfig } from '@store/config/models';
import { toKebabName } from '@lib/kebabName';

export class DirectoryApi {
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

  async fetchDirectoryTenant(tenantName: string): Promise<Directory> {
    const url = `${this.config.host}${this.config.endpoints.directory}/namespaces/${toKebabName(tenantName)}`;

    console.log('in api  tenantUrl', url);
    const res = await this.http.get(url);
    return res?.data;
  }

  async createEntry(service: Service): Promise<boolean> {
    const url = `${this.config.host}${this.config.endpoints.directory}/namespaces/${toKebabName(service.name)}`;

    const payload = {};
    payload['service'] = service.namespace;
    if (service.api) {
      payload['api'] = service.api;
    }
    payload['url'] = service.url;
    const res = await this.http.post(url, payload);
    return res?.data === 'Created';
  }
  async updateEntry(service: Service): Promise<boolean> {
    const url = `${this.config.host}${this.config.endpoints.directory}/namespaces/${toKebabName(service.name)}`;

    const payload = {};
    payload['service'] = service.namespace;
    if (service.api) {
      payload['api'] = service.api;
    }
    payload['url'] = service.url;
    const res = await this.http.put(url, payload);
    return res?.data === 'Created';
  }

  async deleteEntry(service: Service): Promise<boolean> {
    const url = `${this.config.host}${this.config.endpoints.directory}/namespaces/${service.name}`;
    const tenantUrl =
      url.substr(0, url.lastIndexOf('/') + 1) + toKebabName(service.name) + '/services/' + service.namespace;
    const res = await this.http.delete(tenantUrl);
    return res?.data === 'OK';
  }

  async fetchEntryDetail(service: Service): Promise<boolean> {
    const url = `${this.config.host}${this.config.endpoints.directory}/namespaces/${service.name}`;
    const tenantUrl =
      url.substr(0, url.lastIndexOf('/') + 1) + toKebabName(service.name) + '/services/' + service.namespace;
    const res = await this.http.get(tenantUrl);
    return res?.data;
  }
}
