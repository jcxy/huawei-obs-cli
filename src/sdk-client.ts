import ObsClient from 'esdk-obs-nodejs';
import { ObsError, type ObsClientLike, type ObsObject } from './obs.js';

const PAGE_SIZE = 1000;

/**
 * Adapter wiring the real esdk-obs-nodejs SDK to the ObsClientLike seam.
 * Constructed once at the entry point; never imported by unit tests.
 */
export class SdkObsClient implements ObsClientLike {
  private readonly client: InstanceType<typeof ObsClient>;
  private readonly bucket: string;

  constructor(params: { ak: string; sk: string; endpoint: string; bucket: string }) {
    this.client = new ObsClient({
      access_key_id: params.ak,
      secret_access_key: params.sk,
      server: params.endpoint,
    });
    this.bucket = params.bucket;
  }

  async listObjects(prefix: string): Promise<ObsObject[]> {
    const objects: ObsObject[] = [];
    let marker: string | undefined;
    do {
      const result = await this.client.listObjects({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: PAGE_SIZE,
        ...(marker ? { Marker: marker } : {}),
      });
      checkCommon(result.CommonMsg, 'listObjects');
      for (const content of result.InterfaceResult?.Contents ?? []) {
        objects.push({
          key: content.Key,
          size: Number(content.Size ?? 0),
          lastModified: content.LastModified ?? '',
        });
      }
      // SDK parses XML with parseTagValue:false, so IsTruncated is the string 'true'/'false'.
      marker = result.InterfaceResult?.IsTruncated === 'true'
        ? result.InterfaceResult?.NextMarker
        : undefined;
    } while (marker);
    return objects;
  }

  async putObject(key: string, filePath: string): Promise<void> {
    const result = await this.client.putObject({ Bucket: this.bucket, Key: key, SourceFile: filePath });
    checkCommon(result.CommonMsg, 'putObject');
  }

  async getObject(key: string, filePath: string): Promise<void> {
    const result = await this.client.getObject({ Bucket: this.bucket, Key: key, SaveAsFile: filePath });
    checkCommon(result.CommonMsg, 'getObject');
  }

  async copyObject(srcKey: string, destKey: string): Promise<void> {
    // SDK declares CopySource skipEncoding:true — the caller must encode it.
    // Encode per path segment, preserving '/' separators, so non-Latin-1 keys
    // (e.g. Chinese template names) don't crash the HTTP header.
    const copySource = [this.bucket, ...srcKey.split('/')].map(encodeURIComponent).join('/');
    const result = await this.client.copyObject({
      Bucket: this.bucket,
      Key: destKey,
      CopySource: copySource,
    });
    checkCommon(result.CommonMsg, 'copyObject');
  }

  async deleteObject(key: string): Promise<void> {
    const result = await this.client.deleteObject({ Bucket: this.bucket, Key: key });
    checkCommon(result.CommonMsg, 'deleteObject');
  }

  close(): void {
    this.client.close();
  }
}

function checkCommon(
  common: { Status: number; Code?: string; Message?: string },
  operation: string,
): void {
  if (common.Status >= 300) {
    throw new ObsError(common.Status, common.Code ?? 'Unknown', common.Message ?? `OBS ${operation} failed`);
  }
}
