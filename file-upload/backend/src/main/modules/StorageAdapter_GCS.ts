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

	async makePublic(path: string): Promise<void> {
		const bucket = await this.storage.getOrCreateBucket(this.bucketName);
		const file = await bucket.getFile(path);
		await file.makePublic();
	}

	getBucketName(): string | undefined {
		return this.bucketName;
	}
}
