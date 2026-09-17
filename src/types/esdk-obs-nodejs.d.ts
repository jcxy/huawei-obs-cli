declare module 'esdk-obs-nodejs' {
  namespace esdk {
    interface CommonMsg {
      Status: number;
      Code?: string;
      Message?: string;
    }
    interface Content {
      Key: string;
      LastModified?: string;
      /** SDK parses XML with parseTagValue:false — numeric fields arrive as strings. */
      Size?: string;
    }
    interface ListResult {
      CommonMsg: CommonMsg;
      InterfaceResult?: {
        Contents?: Content[];
        /** String 'true'/'false', not a boolean. */
        IsTruncated?: string;
        NextMarker?: string;
      };
    }
    interface BaseResult {
      CommonMsg: CommonMsg;
      InterfaceResult?: Record<string, unknown>;
    }
    interface Options {
      access_key_id: string;
      secret_access_key: string;
      server: string;
    }
  }

  class ObsClient {
    constructor(options: esdk.Options);
    listObjects(params: {
      Bucket: string;
      Prefix?: string;
      MaxKeys?: number;
      Marker?: string;
    }): Promise<esdk.ListResult>;
    putObject(params: { Bucket: string; Key: string; SourceFile: string }): Promise<esdk.BaseResult>;
    getObject(params: { Bucket: string; Key: string; SaveAsFile: string }): Promise<esdk.BaseResult>;
    copyObject(params: { Bucket: string; Key: string; CopySource: string }): Promise<esdk.BaseResult>;
    deleteObject(params: { Bucket: string; Key: string }): Promise<esdk.BaseResult>;
    close(): void;
  }

  export = ObsClient;
}
