import {StorageAdapter, StorageFileMetadata} from '@nu-art/file-upload-shared';
import {createHash} from 'crypto';


export class StorageAdapter_InMemory
	implements StorageAdapter {

	private readonly files = new Map<string, Buffer>();
	private readonly publicFiles = new Set<string>();

	async getWriteSignedUrl(path: string, contentType: string, expiresMs: number): Promise<string> {
		return `inmemory://write/${path}?contentType=${encodeURIComponent(contentType)}`;
	}

	async getReadSignedUrl(path: string, expiresMs: number): Promise<string> {
		return `inmemory://read/${path}`;
	}

	async getFileMetadata(path: string): Promise<StorageFileMetadata> {
		const buffer = this.files.get(path);
		if (!buffer)
			throw new Error(`File not found: ${path}`);

		return {
			size: buffer.length,
			md5Hash: createHash('md5').update(buffer).digest('hex'),
			contentType: 'application/octet-stream',
		};
	}

	async readFile(path: string): Promise<Buffer> {
		const buffer = this.files.get(path);
		if (!buffer)
			throw new Error(`File not found: ${path}`);

		return buffer;
	}

	async deleteFile(path: string): Promise<void> {
		this.files.delete(path);
		this.publicFiles.delete(path);
	}

	async fileExists(path: string): Promise<boolean> {
		return this.files.has(path);
	}

	async makePublic(path: string): Promise<void> {
		if (!this.files.has(path))
			throw new Error(`File not found: ${path}`);

		this.publicFiles.add(path);
	}

	writeFile(path: string, content: Buffer): void {
		this.files.set(path, content);
	}

	isPublic(path: string): boolean {
		return this.publicFiles.has(path);
	}

	clear(): void {
		this.files.clear();
		this.publicFiles.clear();
	}
}
