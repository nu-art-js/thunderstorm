export type StorageFileMetadata = {
	size: number;
	md5Hash?: string;
	contentType?: string;
};

export interface StorageAdapter {
	getWriteSignedUrl(path: string, contentType: string, expiresMs: number): Promise<string>;

	getReadSignedUrl(path: string, expiresMs: number): Promise<string>;

	getFileMetadata(path: string): Promise<StorageFileMetadata>;

	readFile(path: string): Promise<Buffer>;

	deleteFile(path: string): Promise<void>;

	fileExists(path: string): Promise<boolean>;

	/** Server-side write. Browsers use `getWriteSignedUrl` instead. */
	writeFile(path: string, content: Buffer): Promise<void>;

	makePublic?(path: string): Promise<void>;
}
