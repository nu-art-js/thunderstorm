import {
	ApiException,
	BadImplementationException,
	currentTimeMillis,
	Day,
	generateHex,
	Hour,
	ImplementationMissingException,
	MB,
	Minute,
	ThisShouldNotHappenException,
	TypedMap,
} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {ApiHandler} from '@nu-art/http-server';
import {
	API_FileUpload,
	ApiDef_FileUpload,
	AssetStatus,
	DB_Asset,
	DatabaseDef_Assets,
	DBDef_Assets,
	FileValidationConfig,
	FileValidationResult,
	PendingUpload,
	StorageAdapter,
	UploadRequest,
} from '@nu-art/file-upload-shared';
import {fileTypeFromBuffer} from 'file-type';
import {StorageAdapter_GCS} from './StorageAdapter_GCS.js';


type FileUploadConfig = {
	storagePath: string
	bucketName?: string
}

export class ModuleBE_FileUpload_Class
	extends ModuleBE_BaseDB<DatabaseDef_Assets, FileUploadConfig> {

	private storageAdapter!: StorageAdapter;
	private readonly validators: TypedMap<FileValidationConfig> = {};

	constructor() {
		super(DBDef_Assets);
		this.setDefaultConfig({storagePath: 'assets'});
	}

	setStorageAdapter(adapter: StorageAdapter) {
		this.storageAdapter = adapter;
	}

	init() {
		super.init();
		if (!this.storageAdapter) {
			const gcs = new StorageAdapter_GCS(this.config.bucketName);
			gcs.init();
			this.storageAdapter = gcs;
		}
	}

	registerValidator = (key: string, config: FileValidationConfig) => {
		if (this.validators[key] && this.validators[key] !== config)
			throw new BadImplementationException(`File validator already registered for key: ${key}`);

		this.validators[key] = config;
	};

	@ApiHandler(ApiDef_FileUpload.requestUpload)
	async requestUpload(body: API_FileUpload['requestUpload']['Body']): Promise<API_FileUpload['requestUpload']['Response']> {
		return this._requestUpload(body);
	}

	@ApiHandler(ApiDef_FileUpload.confirmUpload)
	async confirmUpload(body: API_FileUpload['confirmUpload']['Body']): Promise<API_FileUpload['confirmUpload']['Response']> {
		return this._confirmUpload(body._id as DB_Asset['_id']);
	}

	@ApiHandler(ApiDef_FileUpload.getReadSignedUrl)
	async getReadSignedUrl(body: API_FileUpload['getReadSignedUrl']['Body']): Promise<API_FileUpload['getReadSignedUrl']['Response']> {
		const asset = await this.query.uniqueAssert(body._id as DB_Asset['_id']);
		const signedUrl = await this.resolveReadSignedUrl(asset);
		return {signedUrl};
	}

	async resolveReadSignedUrl(asset: DB_Asset): Promise<string> {
		if (asset.signedUrl && asset.signedUrl.validUntil > currentTimeMillis())
			return asset.signedUrl.url;

		const url = await this.storageAdapter.getReadSignedUrl(asset.path, Day);
		asset.signedUrl = {url, validUntil: currentTimeMillis() + Day - Minute};
		await this.set.item(asset);
		return url;
	}

	private _requestUpload = async (files: UploadRequest[]): Promise<PendingUpload[]> => {
		return Promise.all(files.map(async (file) => {
			const key = file.key || file.mimeType;

			if (!this.validators[key])
				throw new ImplementationMissingException(`Missing validator for type: ${key}`);

			const _id = generateHex(32) as DB_Asset['_id'];
			const path = `${this.config.storagePath}/${_id}`;
			const ext = file.name.substring(file.name.toLowerCase().lastIndexOf('.') + 1);

			const asset = await this.set.item({
				_id,
				name: file.name,
				ext,
				mimeType: file.mimeType,
				key,
				path,
				bucketName: this.config.bucketName ?? 'default',
				status: AssetStatus.Pending,
				public: file.public,
				metadata: file.metadata,
			} as DB_Asset);

			const signedUrl = await this.storageAdapter.getWriteSignedUrl(path, file.mimeType, Hour);

			return {signedUrl, asset};
		}));
	};

	private _confirmUpload = async (assetId: DB_Asset['_id']): Promise<DB_Asset> => {
		const asset = await this.query.uniqueAssert(assetId);

		if (asset.status !== AssetStatus.Pending)
			throw new ApiException(400, `Asset ${assetId} is not in pending status (current: ${asset.status})`);

		if (!await this.storageAdapter.fileExists(asset.path))
			throw new ApiException(400, `File not found in storage at path: ${asset.path}`);

		const validationConfig = this.validators[asset.key];
		if (!validationConfig)
			throw new ImplementationMissingException(`Missing validator for key: ${asset.key}`);

		const metadata = await this.storageAdapter.getFileMetadata(asset.path);

		if (validationConfig.minSize !== undefined || validationConfig.maxSize !== undefined) {
			const minSize = validationConfig.minSize ?? 0;
			const maxSize = validationConfig.maxSize ?? MB;
			if (metadata.size < minSize || metadata.size > maxSize)
				return this.failAsset(asset, `File size ${metadata.size} outside allowed range [${minSize}, ${maxSize}]`);
		}

		if (validationConfig.allowedMimeTypes?.length) {
			if (!validationConfig.allowedMimeTypes.includes(asset.mimeType))
				return this.failAsset(asset, `MIME type ${asset.mimeType} not in allowed list: ${validationConfig.allowedMimeTypes.join(', ')}`);
		}

		const fileBuffer = await this.storageAdapter.readFile(asset.path);
		let validationResult: FileValidationResult | undefined;

		if (validationConfig.validator) {
			try {
				validationResult = await validationConfig.validator(metadata, asset, fileBuffer);
			} catch (e: any) {
				return this.failAsset(asset, `Custom validator failed: ${e.message}`);
			}
		} else {
			const fileType = await fileTypeFromBuffer(fileBuffer);
			if (fileType) {
				if (fileType.mime !== asset.mimeType) {
					this.logWarning(`Declared MIME (${asset.mimeType}) differs from detected (${fileType.mime})`);
					return this.failAsset(asset, `Declared MIME type (${asset.mimeType}) does not match detected type (${fileType.mime})`);
				}

				validationResult = {ext: fileType.ext, mime: fileType.mime};
			}
		}

		if (validationResult && asset.ext !== validationResult.ext) {
			this.logWarning(`Renaming file extension: ${asset.ext} => ${validationResult.ext}`);
			asset.ext = validationResult.ext;
		}

		asset.md5Hash = metadata.md5Hash;
		asset.status = AssetStatus.Validated;

		if (asset.public && this.storageAdapter.makePublic) {
			try {
				await this.storageAdapter.makePublic(asset.path);
			} catch (e: any) {
				return this.failAsset(asset, `Failed to make file public: ${e.message}`);
			}
		}

		return this.set.item(asset);
	};

	private failAsset = async (asset: DB_Asset, reason: string): Promise<never> => {
		asset.status = AssetStatus.Failed;
		await this.set.item(asset);
		throw new ApiException(400, `Asset validation failed for ${asset.name}: ${reason}`);
	};

	async cleanupStaleAssets(maxAgeMs: number = Hour) {
		const cutoff = currentTimeMillis() - maxAgeMs;
		const staleAssets = await this.query.custom({where: {status: AssetStatus.Pending, __created: {$lt: cutoff}} as any});

		for (const asset of staleAssets) {
			try {
				if (await this.storageAdapter.fileExists(asset.path))
					await this.storageAdapter.deleteFile(asset.path);
			} catch (e: any) {
				this.logError(`Failed to delete stale file: ${asset.path}`, e);
			}
		}

		if (staleAssets.length)
			await this.delete.all(staleAssets.map(a => a._id));
	}

	getStorageAdapter(): StorageAdapter {
		if (!this.storageAdapter)
			throw new ThisShouldNotHappenException('Storage adapter not initialized');

		return this.storageAdapter;
	}
}

export const ModuleBE_FileUpload = new ModuleBE_FileUpload_Class();
