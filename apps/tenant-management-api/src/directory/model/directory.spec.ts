import { DirectoryEntity } from './directory';
import { DirectoryRepository } from '../repository';
import { Mock } from 'moq.ts';
import { Directory } from '../types/directory';

describe('DirectoryEntity', () => {
  const serviceMock = {
    isConnected: jest.fn(() => true),
    send: jest.fn(),
  };

  beforeEach(() => {
    serviceMock.send.mockReset();
  });
  const testDirectory: Directory = {
    id: '60d4fadbb662612a75295749',
    name: 'platform',
    services: [
      {
        service: 'tenant-service',
        host: 'http://tenant-management-api:3333',
      },
    ],
  };
  const repositoryMock = new Mock<DirectoryRepository>();
  const entity = new DirectoryEntity(repositoryMock.object(), testDirectory);
  repositoryMock.setup((m) => m.save(entity)).returns(Promise.resolve(entity));

  it('Created directory', (done) => {
    expect(entity).toBeTruthy();
    expect(entity.name).toBeTruthy();
    expect(entity.services).toBeTruthy();
    expect(entity.services.length).toBe(1);
    done();
  });
  it('Update directory', () => {
    const entity = new DirectoryEntity(repositoryMock.object(), testDirectory);
    expect(entity).toBeTruthy();
    expect(entity.name).toBeTruthy();
    expect(entity.services).toBeTruthy();
    expect(entity.services.length).toBe(1);

    const updateDirectory: Directory = {
      id: '60d4fadbb662612a75295748',
      name: 'platform-service',
      services: [
        {
          service: 'tenant-service',
          host: 'http://tenant-management-api:3333',
        },
        {
          service: 'tenant-service:v2',
          host: 'http://tenant-management-api:3333/api/tenant/v2',
        },
      ],
    };

    entity.update(updateDirectory);

    expect(entity.name).toBe(updateDirectory.name);
    expect(entity.services.length).toBe(2);
  });
});
