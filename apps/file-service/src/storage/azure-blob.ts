import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import * as hasha from 'hasha';
import { Readable } from 'stream';
import { Logger } from 'winston';
import * as detect from 'detect-file-type';
import { FileEntity, FileStorageProvider } from '../file';

interface AzureBlobStorageProviderProps {
  BLOB_ACCOUNT_NAME: string;
  BLOB_ACCOUNT_KEY: string;
  BLOB_ACCOUNT_URL: string;
}

const BUFFER_SIZE = 4 * 1024 * 1024;
const MAX_BUFFERS = 20;

export class AzureBlobStorageProvider implements FileStorageProvider {
  private blobServiceClient: BlobServiceClient;

  constructor(
    private logger: Logger,
    { BLOB_ACCOUNT_URL, BLOB_ACCOUNT_NAME, BLOB_ACCOUNT_KEY }: AzureBlobStorageProviderProps
  ) {
    const credential = new StorageSharedKeyCredential(BLOB_ACCOUNT_NAME, BLOB_ACCOUNT_KEY);
    this.blobServiceClient = new BlobServiceClient(BLOB_ACCOUNT_URL, credential);
  }

  private createReadable(entity: FileEntity, stream: NodeJS.ReadableStream) {
    stream.on('closed', () => {
      this.logger.debug(`Reading file ${entity.filename} (ID: ${entity.id}) blob ${entity.id} stream: stream closed.`, {
        tenant: entity.tenantId?.toString(),
        context: 'AzureBlobStorageProvider',
      });
    });
    stream.on('error', (err) => {
      this.logger.error(`Error in read file ${entity.filename} (ID: ${entity.id}) blob ${entity.id} stream. ${err}`, {
        tenant: entity.tenantId?.toString(),
        context: 'AzureBlobStorageProvider',
      });
    });
    return stream as Readable;
  }

  async readFile(entity: FileEntity): Promise<Readable> {
    try {
      const containerClient = await this.getContainerClient(entity);
      const blobClient = containerClient.getBlockBlobClient(entity.id);
      const result = await blobClient.download(0, entity.size);
      return this.createReadable(entity, result.readableStreamBody);
    } catch (err) {
      this.logger.error(`Error in read file ${entity.filename} (ID: ${entity.id}) blob ${entity.id}. ${err}`, {
        tenant: entity.tenantId?.toString(),
        context: 'AzureBlobStorageProvider',
      });
      throw err;
    }
  }

  async saveFile(entity: FileEntity, content: Readable): Promise<boolean> {
    try {
      const containerClient = await this.getContainerClient(entity);
      const blobClient = containerClient.getBlockBlobClient(entity.id);

      const tags: Record<string, string> = {
        tenant: entity.tenantId.resource,
        fileId: entity.id,
        typeId: entity.type.id,
        filename: hasha(entity.filename, { algorithm: 'sha1', encoding: 'base64' }),
        createdById: entity.createdBy.id,
      };

      if (entity.recordId) {
        tags.recordId = hasha(entity.recordId, { algorithm: 'sha1', encoding: 'base64' });
      }

      const start = Date.now();
      console.log('Start:' + start);

      let accumulatedData = Buffer.alloc(0); // Start with an empty buffer

      const onData = (chunk) => {
        accumulatedData = Buffer.concat([accumulatedData, chunk]);

        if (accumulatedData.length > 0) {
          // You have enough data to detect the file type

          detect.fromBuffer(accumulatedData, (err, result) => {
            if (err) {
              console.log('err below');
              return console.log(err);
            }
            console.log('Extension: ' + JSON.stringify(result)); // { ext: 'jpg', mime: 'image/jpeg' }
          });

          // Stop listening to data events - if you remove the following line, it will keep going through every chunking to determine file type - having it there only checks the first chunk (65536 bytes seems to be the default)
          content.removeListener('data', onData);
          //content.pause(); // Some examples have this, but if you uncomment it the app just hangs here - we need to free up 'content' to allow it to be uploaded afterwards
        }

        console.log('ondata:' + Date.now());
      };

      content.on('data', onData);

      content.on('end', () => {
        console.log('accumulatedData.length:' + JSON.stringify(accumulatedData.length));

        if (accumulatedData.length < 8) {
          console.error('Stream ended prematurely, not enough data to detect the file type.');
        }
        console.log('done');
      });

      content.on('error', (err) => {
        console.error('An error occurred:', err);
      });

      const end = Date.now();

      console.log('End:' + end);
      console.log('Diff:' + (end - start));

      const { requestId } = await blobClient.uploadStream(content, BUFFER_SIZE, MAX_BUFFERS, { tags });

      console.log('requestId:' + requestId);

      const properties = await blobClient.getProperties();
      await entity.setSize(properties.contentLength);

      this.logger.debug(
        `Uploaded file ${entity.filename} (ID: ${entity.id}) as blob ${entity.id} with requestId: ${requestId}`,
        {
          tenant: entity.tenantId?.toString(),
          context: 'AzureBlobStorageProvider',
        }
      );

      return true;
    } catch (err) {
      this.logger.error(`Error in file upload ${entity.filename} (ID: ${entity.id}) as blob ${entity.id}. ${err}`, {
        tenant: entity.tenantId?.toString(),
        context: 'AzureBlobStorageProvider',
      });
      return false;
    }
  }

  async deleteFile(entity: FileEntity): Promise<boolean> {
    try {
      const containerClient = await this.getContainerClient(entity);
      const blobClient = containerClient.getBlockBlobClient(entity.id);
      await blobClient.deleteIfExists();

      return true;
    } catch (err) {
      this.logger.error(`Error in delete file ${entity.filename} (ID: ${entity.id}) blob ${entity.id}. ${err}`, {
        tenant: entity.tenantId?.toString(),
        context: 'AzureBlobStorageProvider',
      });
      return false;
    }
  }

  private async getContainerClient(entity: FileEntity): Promise<ContainerClient> {
    const container = entity.tenantId.resource.substring(9);
    const containerClient = this.blobServiceClient.getContainerClient(container);
    await containerClient.createIfNotExists();

    return containerClient;
  }
}
