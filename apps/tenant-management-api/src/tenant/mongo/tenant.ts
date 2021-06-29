import { TenantRepository } from '../repository';
import { TenantEntity, Tenant } from '../models';
import { Doc } from '@core-services/core-common';
import { adspId } from '@abgov/adsp-service-sdk';
import { model } from 'mongoose';
import { tenantSchema } from './schema';
import { NotFoundError } from '@core-services/core-common';
export class TenantMongoRepository implements TenantRepository {
  private tenantModel;

  constructor() {
    this.tenantModel = model('tenant', tenantSchema);
  }

  async save(tenant: TenantEntity): Promise<TenantEntity> {
    const doc = await new this.tenantModel(this.toDoc(tenant)).save();
    return Promise.resolve(this.fromDoc(doc));
  }

  async delete(realm: string) {
    await this.tenantModel.deleteOne({ realm: realm });
  }

  async find(): Promise<TenantEntity[]> {
    const docs = await this.tenantModel.find({});

    return Promise.resolve(
      docs?.map((doc) => ({
        id: adspId`urn:ads:platform:tenant-service:v2:/tenants/${doc._id}`,
        name: doc.name,
        realm: doc.realm,
        createdBy: doc.adminEmail,
      }))
    );
  }

  async issuers(): Promise<string[]> {
    const issuers = await this.tenantModel.find().select('tokenIssuer');

    if (issuers) {
      return Promise.resolve(
        issuers.map((issuerObj) => issuerObj.tokenIssuer).filter((tokenIssuer) => tokenIssuer !== undefined)
      );
    } else {
      return Promise.resolve([]);
    }
  }

  async validateIssuer(issuer: string): Promise<boolean> {
    const isExisted = await this.tenantModel.exists({ tokenIssuer: issuer });
    return Promise.resolve(isExisted);
  }

  async isTenantAdmin(email: string): Promise<boolean> {
    const tenant = await this.tenantModel.findOne({ adminEmail: email }).populate('createdBy');
    return Promise.resolve(tenant !== null);
  }

  async fetchRealmToNameMapping(): Promise<Record<string, string>> {
    const docs = await this.find();
    const mapping = {};
    for (const tenant of docs) {
      mapping[tenant.realm] = tenant.name;
    }
    return Promise.resolve(mapping);
  }

  async findBy(filter: Record<string, string>): Promise<TenantEntity> {
    const tenant = await this.tenantModel.findOne(filter).populate('createdBy');

    if (tenant == null) {
      throw new NotFoundError('Fetch tenant by filter', filter.toString());
    }

    return Promise.resolve(this.fromDoc(tenant));
  }

  private fromDoc(doc: Doc<Tenant>) {
    if (doc === null) {
      throw new NotFoundError('Tenant', null);
    }
    return new TenantEntity(this, doc._id, doc.realm, doc.adminEmail, doc.tokenIssuer, doc.name);
  }

  private toDoc(tenant: TenantEntity) {
    const id = tenant.id.toString().split('/').pop();

    return {
      ...tenant,
      id,
    };
  }
}
