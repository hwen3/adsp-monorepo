import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import { TenantEntity } from '../models';
import { TenantMongoRepository } from './tenant';

describe('Mongo: Tenant', () => {
  const repo = new TenantMongoRepository();

  beforeEach(async () => {
    await connect();
  });

  afterEach(async () => {
    await disconnect();
  });

  it('should create a tenant', async () => {
    const data = await createMockData<TenantEntity>(repo, [
      {
        tokenIssuer: 'ti',
        adminEmail: 'ae',
        realm: 'r',
        name: 'n',
      },
    ]);
    const results = await repo.find();
    expect(results.length).toEqual(data.length);
  });
});
