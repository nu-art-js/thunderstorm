/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
	ApiException,
	auditBy,
	BadImplementationException,
	batchActionParallel,
	currentTimeMillis,
	Day,
	generateHex,
	Hour,
	ImplementationMissingException,
	MB,
	Minute,
	MUSTNeverHappenException,
	PreDB,
	ThisShouldNotHappenException,
	TypedMap
} from '@nu-art/ts-common';
import {FileWrapper, FirebaseType_Metadata, FirestoreTransaction, ModuleBE_Firebase, StorageWrapperBE} from '@nu-art/firebase/backend';
import {ModuleBE_AssetsTemp} from './ModuleBE_AssetsTemp';
import {ModuleBE_PushPubSub} from '@nu-art/push-pub-sub/backend';
import {AxiosHttpModule, CleanupDetails, OnCleanupSchedulerAct} from '@nu-art/thunderstorm/backend';
import {FileExtension, fromBuffer, MimeType} from 'file-type';
import {Clause_Where, FirestoreQuery} from '@nu-art/firebase';
import {OnAssetUploaded} from './ModuleBE_BucketListener';
import {
	ApiDef_Assets,
	BaseUploaderFile,
	DB_Asset,
	DBDef_Assets,
	FileStatus,
	Push_FileUploaded,
	PushKey_FileUploaded,
	Request_GetReadSecuredUrl,
	TempSecureUrl
} from '../../shared';
import {DBApiConfig} from '@nu-art/db-api-generator/backend';
import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {HttpMethod} from '@nu-art/thunderstorm';


type MyConfig = DBApiConfig<DB_Asset> & {
	authKey: string
	bucketName?: string
	storagePath: string
	pathRegexp: string
}

export type AssetContent = {
	asset: DB_Asset
	content: Buffer
}

export  type FileTypeResult = {
	ext: FileExtension;
	mime: MimeType;
} | {
	ext: string;
	mime: string;
}

export type FileTypeValidation = {
	fileType?: string[],
	minSize?: number
	maxSize?: number
	validator?: FileValidator
}

export const DefaultMimetypeValidator = async (file: FileWrapper, doc: DB_Asset) => {
	const buffer = await file.read();
	const fileType = await fromBuffer(buffer);
	if (!fileType)
		throw new ImplementationMissingException(`No validator defined for asset of mimetype: ${doc.mimeType}`);

	if (fileType.mime !== doc.mimeType)
		throw new BadImplementationException(`Original mimetype (${doc.mimeType}) does not match the resolved mimetype: (${fileType.mime})`);

	return fileType;
};

export type FileValidator = (file: FileWrapper, doc: DB_Asset) => Promise<FileTypeResult | undefined>;
export const fileSizeValidator = async (file: FileWrapper, metadata: FirebaseType_Metadata, minSizeInBytes: number = 0, maxSizeInBytes: number = MB) => {
	if (!metadata.size)
		throw new ThisShouldNotHappenException(`could not resolve metadata.size for file: ${file.path}`);

	return metadata.size >= minSizeInBytes && metadata.size <= maxSizeInBytes;
};

export class ModuleBE_AssetsDB_Class
	extends ModuleBE_BaseDBV2<DB_Asset, MyConfig>
	implements OnCleanupSchedulerAct, OnAssetUploaded {

	constructor() {
		super(DBDef_Assets);
		this.setDefaultConfig({
			...this.config,
			storagePath: 'assets',
			pathRegexp: '^assets/.*',
			authKey: 'file-uploader'
		});
	}

	private storage!: StorageWrapperBE;

	mimeTypeValidator: TypedMap<FileValidator> = {};
	fileValidator: TypedMap<FileTypeValidation> = {};

	init() {
		super.init();
		this.storage = ModuleBE_Firebase.createAdminSession(this.config.authKey).getStorage();
	}

	protected async upgradeItem(dbItem: PreDB<DB_Asset>, toVersion: string): Promise<void> {
		switch (dbItem._v) {
			case '1.0.0': {

				// @ts-ignore
				delete dbItem.secureUrl;
				const fileWrapper = await this.storage.getFile(dbItem.path, dbItem.bucketName);
				if (await fileWrapper.exists())
					return;

				let _securedUrl;
				try {
					const {securedUrl} = await AxiosHttpModule.createRequest({
						...ApiDef_Assets.vv1.fetchSpecificFile,
						fullUrl: 'https://api-hhvladacia-uc.a.run.app/v1/assets/get-read-secured-url'
					})
						.setBodyAsJson({bucketName: dbItem.bucketName, pathInBucket: dbItem.path})
						.executeSync();
					_securedUrl = securedUrl;
				} catch (e) {
					console.log(e);
				}

				const fileContent = await AxiosHttpModule.createRequest({method: HttpMethod.GET, fullUrl: _securedUrl, path: ''})
					.setResponseType('text')
					.executeSync();

				await fileWrapper.write(fileContent);
			}
		}
	}

	fetchSpecificFile = async (body: Request_GetReadSecuredUrl) => {
		this.logInfo('fetchSpecificFile - got here');
		const fileWrapper = await this.storage.getFile(body.pathInBucket, body.bucketName);

		this.logInfo('fetchSpecificFile - got fileWrapper');
		const securedUrl = await fileWrapper.getReadSecuredUrl();

		this.logInfo('fetchSpecificFile - got securedUrl');
		return securedUrl;
	};

	async getAssetsContent(assetIds: string[]): Promise<AssetContent[]> {
		const assetsToSync = await batchActionParallel<string, DB_Asset>(assetIds, 10, async chunk => await ModuleBE_AssetsDB.query.custom({where: {_id: {$in: chunk}}}));
		const assetFiles = await Promise.all(assetsToSync.map(asset => this.storage.getFile(asset.path, asset.bucketName)));
		const assetContent = await Promise.all(assetFiles.map(asset => asset.read()));

		return assetIds.map((id, index) => ({asset: assetsToSync[index], content: assetContent[index]}));
	}

	registerTypeValidator(mimeType: string, validator: (file: FileWrapper, doc: DB_Asset) => Promise<void>) {

	}

	async queryUnique(where: Clause_Where<DB_Asset>, transaction?: FirestoreTransaction): Promise<DB_Asset> {
		const asset = await super.query.uniqueCustom({where});
		const signedUrl = (asset.signedUrl?.validUntil || 0) > currentTimeMillis() ? asset.signedUrl : undefined;
		if (!signedUrl) {
			const url = await (await this.storage.getFile(asset.path, asset.bucketName)).getReadSecuredUrl(Day, asset.mimeType);
			asset.signedUrl = {
				url: url.securedUrl,
				validUntil: currentTimeMillis() + Day - Minute
			};
		}
		return asset;
	}

	register(key: string, validationConfig: FileTypeValidation) {
		if (this.fileValidator[key] && this.fileValidator[key] !== validationConfig)
			throw new BadImplementationException(`File Validator already exists for key: ${key}`);

		this.fileValidator[key] = validationConfig;
	}

	__onCleanupSchedulerAct(): CleanupDetails {
		return {
			moduleKey: this.getName(),
			interval: Day,
			cleanup: () => this.cleanup(),
		};
	}

	private cleanup = async (interval = Hour, module: ModuleBE_BaseDBV2<DB_Asset> = ModuleBE_AssetsTemp) => {
		const entries: DB_Asset[] = await module.query.custom({where: {timestamp: {$lt: currentTimeMillis() - interval}}});
		const bucketName = this.config?.bucketName;
		const bucket = await this.storage.getOrCreateBucket(bucketName);
		await Promise.all(entries.map(async dbAsset => {
			const file = await bucket.getFile(dbAsset.path);
			if (!(await file.exists()))
				return;

			await file.delete();
		}));

		await module.delete.query({where: {timestamp: {$lt: currentTimeMillis() - interval}}});
	};

	async getUrl(files: BaseUploaderFile[]): Promise<TempSecureUrl[]> {
		const bucketName = this.config?.bucketName;
		const bucket = await this.storage.getOrCreateBucket(bucketName);
		return Promise.all(files.map(async _file => {
			const key = _file.key || _file.mimeType;

			// this will fail the entire request... should it?
			if (!this.fileValidator[key])
				throw new ImplementationMissingException(`Missing validator for type ${key}`);

			const _id = generateHex(32);
			const path = `${this.config.storagePath}/${_id}`;
			const dbAsset: PreDB<DB_Asset> = {
				timestamp: currentTimeMillis(),
				_id,
				feId: _file.feId,
				name: _file.name,
				ext: _file.name.substring(_file.name.toLowerCase().lastIndexOf('.') + 1),
				mimeType: _file.mimeType,
				key,
				path,
				_audit: auditBy('be-stub'),
				bucketName: bucket.bucketName
			};

			if (_file.public)
				dbAsset.public = _file.public;

			const dbTempMeta = await ModuleBE_AssetsTemp.set.item(dbAsset);
			const fileWrapper = await bucket.getFile(dbTempMeta.path);
			const url = await fileWrapper.getWriteSecuredUrl(_file.mimeType, Hour);
			return {
				securedUrl: url.securedUrl,
				asset: dbTempMeta
			};
		}));
	}

	processAssetManually = async (feId?: string) => {
		let query: FirestoreQuery<DB_Asset> = {limit: 1};
		if (feId)
			query = {where: {feId}};

		const unprocessedFiles: DB_Asset[] = await ModuleBE_AssetsTemp.query.custom(query);
		return Promise.all(unprocessedFiles.map(asset => this.__processAsset(asset.path)));
	};

	__processAsset = async (filePath?: string) => {
		if (!filePath)
			throw new MUSTNeverHappenException('Missing file path');

		if (!filePath.match(this.config.pathRegexp))
			return this.logVerbose(`File was added to storage in path: ${filePath}, NOT via file uploader`);

		this.logDebug(`Looking for file with path: ${filePath}`);
		let tempMeta: DB_Asset;
		try {
			tempMeta = await ModuleBE_AssetsTemp.query.uniqueWhere({path: filePath});
		} catch (e) {
			return;
		}
		if (!tempMeta)
			throw new ThisShouldNotHappenException(`Could not find meta for file with path: ${filePath}`);

		await this.notifyFrontend(FileStatus.Processing, tempMeta);
		this.logDebug(`Found temp meta with _id: ${tempMeta._id}`, tempMeta);
		const validationConfig = this.fileValidator[tempMeta.key];
		if (!validationConfig)
			return this.notifyFrontend(FileStatus.ErrorNoConfig, tempMeta);

		let mimetypeValidator: FileValidator = DefaultMimetypeValidator;
		if (validationConfig.validator)
			mimetypeValidator = validationConfig.validator;

		if (!mimetypeValidator && validationConfig.fileType && validationConfig.fileType.includes(tempMeta.mimeType))
			mimetypeValidator = this.mimeTypeValidator[tempMeta.mimeType];

		if (!mimetypeValidator)
			return this.notifyFrontend(FileStatus.ErrorNoValidator, tempMeta);

		const file = await this.storage.getFile(tempMeta.path, tempMeta.bucketName);

		try {
			const metadata = (await file.getDefaultMetadata()).metadata;
			if (!metadata)
				return this.notifyFrontend(FileStatus.ErrorRetrievingMetadata, tempMeta);

			await fileSizeValidator(file, metadata, validationConfig.minSize, validationConfig.maxSize);
			const fileType = await mimetypeValidator(file, tempMeta);

			tempMeta.md5Hash = metadata.md5Hash;
			if (fileType && tempMeta.ext !== fileType.ext) {
				this.logWarning(`renaming the file extension name: ${tempMeta.ext} => ${fileType.ext}`);
				tempMeta.ext = fileType.ext;
			}
		} catch (e: any) {
			//TODO delete the file and the temp doc
			this.logError(`Error while processing asset: ${tempMeta.name}`, e);
			return this.notifyFrontend(FileStatus.ErrorWhileProcessing, tempMeta);
		}

		if (tempMeta.public) {
			try {
				// need to handle the response status!
				await file.makePublic();
			} catch (e: any) {
				return this.notifyFrontend(FileStatus.ErrorMakingPublic, tempMeta);
			}
		}

		const finalDbAsset = await this.runTransaction(async (transaction): Promise<DB_Asset> => {
			const duplicatedAssets = await this.query.custom({where: {md5Hash: tempMeta.md5Hash}}, transaction);
			if (duplicatedAssets.length && duplicatedAssets[0]) {
				this.logWarning(`${tempMeta.feId} is a duplicated entry for ${duplicatedAssets[0]._id}`);
				return {...duplicatedAssets[0], feId: tempMeta.feId};
			}

			const doc = await this.collection.doc.item(tempMeta);
			await ModuleBE_AssetsTemp.delete.unique(tempMeta._id, transaction);
			return await doc.set(tempMeta, transaction);
		});

		return this.notifyFrontend(FileStatus.Completed, finalDbAsset);
	};

	private notifyFrontend = async (status: FileStatus, asset: DB_Asset, feId?: string) => {
		if (status !== FileStatus.Completed && status !== FileStatus.Processing) {
			const message = `Error while processing asset: ${status}\n Failed on \n  Asset: ${asset.feId}\n    Key: ${asset.key}\n   Type: ${asset.mimeType}\n   File: ${asset.name}`;
			throw new ApiException(500, message);
		}

		this.logDebug(`notify FE about asset ${feId}: ${status}`);
		return ModuleBE_PushPubSub.pushToKey<Push_FileUploaded>(PushKey_FileUploaded, {feId: feId || asset.feId}, {
			status,
			asset
		});
	};
}

export const ModuleBE_AssetsDB = new ModuleBE_AssetsDB_Class();



