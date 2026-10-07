import {Hour, Minute} from '@nu-art/ts-common';
import {ModuleBE_Firebase, StorageWrapperBE} from '@nu-art/firebase-backend';
import {StorageAdapter, StorageFileMetadata} from '@nu-art/file-upload-shared';


export class StorageAdapter_GCS
	implements StorageAdapter {

	private storage!: StorageWrapperBE;
	private bucketName?: string;

	constructor(bucketName?: string) {
		this.bucketName = bucketName;
	}

	init() {
		this.storage = ModuleBE_Firebase.createAdminSession().getStorage();
	}

	/** Signed-URL uploads are credentialed by the URL. The bucket must answer the browser preflight. */
	async ensureSignedUrlCors(): Promise<void> {
		const wrapped = await this.storage.getOrCreateBucket(this.bucketName);
		const [metadata] = await wrapped.bucket.getMetadata();
		const rules = metadata.cors ?? [];
		const allowsBrowserPut = rules.some(rule =>
			(rule.origin ?? []).includes('*') && (rule.method ?? []).includes('PUT'));
		if (allowsBrowserPut)
			return;

		await wrapped.bucket.setCorsConfiguration([{
			origin: ['*'],
			method: ['GET', 'HEAD', 'PUT', 'OPTIONS'],
			responseHeader: ['Content-Type', 'Content-Length', 'Content-MD5', 'x-goog-hash'],
			maxAgeSeconds: 3600,
		}]);
	}

	async getWriteSignedUrl(path: string, contentType: string, expiresMs: number = Hour): Promise<string> {
		const bucket = await this.storage.getOrCreateBucket(this.bucketName);
		const file = await bucket.getFile(path);
		const result = await file.getWriteSignedUrl(contentType, expiresMs);
		return result.signedUrl;
	}

	async getReadSignedUrl(path: string, expiresMs: number = 5 * Minute): Promise<string> {
		const bucket = await this.storage.getOrCreateBucket(this.bucketName);
		const file = await bucket.getFile(path);
		const result = await file.getReadSignedUrl(expiresMs);
		return result.signedUrl;
	}

	async getFileMetadata(path: string): Promise<StorageFileMetadata> {
		const bucket = await this.storage.getOrCreateBucket(this.bucketName);
		const file = await bucket.getFile(path);
		const metadata = await file.getMetadata();
		return {
			size: +(metadata.size ?? 0),
			md5Hash: metadata.md5Hash as string | undefined,
			contentType: metadata.contentType as string | undefined,
		};
	}

	async readFile(path: string): Promise<Buffer> {
		const bucket = await this.storage.getOrCreateBucket(this.bucketName);
		const file = await bucket.getFile(path);
		return file.read();
	}

	async deleteFile(path: string): Promise<void> {
		const bucket = await this.storage.getOrCreateBucket(this.bucketName);
		const file = await bucket.getFile(path);
		await file.delete();
	}

	async fileExists(path: string): Promise<boolean> {
		const bucket = await this.storage.getOrCreateBucket(this.bucketName);
		const file = await bucket.getFile(path);
		return file.exists();
	}

	async writeFile(path: string, content: Buffer): Promise<void> {
		const bucket = await this.storage.getOrCreateBucket(this.bucketName);
		const file = await bucket.getFile(path);
		await file.write(content);
	}

	async makePublic(path: string): Promise<void> {
		const bucket = await this.storage.getOrCreateBucket(this.bucketName);
		const file = await bucket.getFile(path);
		await file.makePublic();
	}

	getBucketName(): string | undefined {
		return this.bucketName;
	}
}
