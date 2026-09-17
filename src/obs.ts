/** Minimal interface the command layer depends on — the single test seam. */

export interface ObsObject {
  key: string;
  /** Size in bytes. */
  size: number;
  /** Last modified time, ISO 8601 string. */
  lastModified: string;
}

export interface ObsClientLike {
  listObjects(prefix: string): Promise<ObsObject[]>;
  putObject(key: string, filePath: string): Promise<void>;
  getObject(key: string, filePath: string): Promise<void>;
  copyObject(srcKey: string, destKey: string): Promise<void>;
  deleteObject(key: string): Promise<void>;
}

export class ObsError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ObsError';
  }
}

/** Result of a command handler: what to print and the process exit code. */
export interface CommandResult {
  ok: boolean;
  output: string;
}
