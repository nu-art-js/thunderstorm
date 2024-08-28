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
	asArray,
	BadImplementationException,
	currentTimeMillis,
	Day,
	exists,
	filterInstances,
	generateHex,
	Hour,
	ImplementationMissingException,
	MB,
	Minute,
	MUSTNeverHappenException,
	ThisShouldNotHappenException,
	TypedMap
} from '@thunder-storm/common';
import {FileWrapper, FirebaseType_Metadata, FirestoreTransaction} from '@thunder-storm/firebase/backend';
import {ModuleBE_AssetsTemp} from './ModuleBE_AssetsTemp';
import {addRoutes, CleanupDetails, createBodyServerApi, DBApiConfigV3, ModuleBE_BaseDB, OnCleanupSchedulerAct} from '@thunder-storm/core/backend';
import {FileExtension, fromBuffer, MimeType} from 'file-type';
import {Clause_Where, FirestoreQuery} from '@thunder-storm/firebase';
import {OnAssetUploaded} from './ModuleBE_BucketListener';
import {ModuleBE_AssetsStorage} from './ModuleBE_AssetsStorage';
import {ApiDef_AssetUploader, DB_Asset, DBDef_Assets, DBProto_Assets, FileStatus, TempSignedUrl, UI_Asset} from '../../shared';
import {PushMessageBE_FileUploadStatus} from '../core/messages';
import {
	CollectionActionType,
	PostWriteProcessingData
} from '@thunder-storm/firebase/backend/firestore-v3/FirestoreCollectionV3';
import {ModuleBE_AssetsDeleted} from './ModuleBE_AssetsDeleted';
import {firestore} from 'firebase-admin';
import Transaction = firestore.Transaction;


type MyConfig = DBApiConfigV3<DBProto_Assets> & {
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
	extends ModuleBE_BaseDB<DBProto_Assets, MyConfig>
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

	mimeTypeValidator: TypedMap<FileValidator> = {};
	fileValidator: TypedMap<FileTypeValidation> = {};

	protected async postWriteProcessing(data: PostWriteProcessingData<DBProto_Assets>, actionType: CollectionActionType, transaction?: Transaction): Promise<void> {
		const deletedItems = data.deleted;
		if (exists(deletedItems))
			await ModuleBE_AssetsDeleted.create.all(asArray(deletedItems), transaction);
	}

	init() {
		super.init();
		addRoutes([
			createBodyServerApi(ApiDef_AssetUploader.vv1.getUploadUrl, this.getUrl)
		]);

		this.registerVersionUpgradeProcessor('1.0.1', async (assets) => {
			assets.forEach(asset => {
				// @ts-ignore
				delete asset._audit;
			});
		});

		const originalQuery = this.query;
		this.query = {
			...originalQuery,
			unique: async (_id, transaction) => {
				const dbAsset = await originalQuery.uniqueAssert(_id, transaction);
				const signedUrl = (dbAsset.signedUrl?.validUntil || 0) > currentTimeMillis() ? dbAsset.signedUrl : undefined;
				if (!signedUrl) {
					const url = await ModuleBE_AssetsStorage.getReadSignedUrl(dbAsset);
					dbAsset.signedUrl = {
						url,
						validUntil: currentTimeMillis() + Day - Minute
					};
				}

				return dbAsset;
			}
		};
	}

	async getAssetsContent(assetIds: string[]): Promise<AssetContent[]> {
		const assetsToSync = filterInstances(await ModuleBE_AssetsDB.query.all(assetIds));
		const assetFiles = await Promise.all(assetsToSync.map(asset => ModuleBE_AssetsStorage.getFile(asset)));
		const assetContent = await Promise.all(assetFiles.map(asset => asset.read()));

		return assetIds.map((id, index) => ({asset: assetsToSync[index], content: assetContent[index]}));
	}

	registerTypeValidator(mimeType: string, validator: (file: FileWrapper, doc: DB_Asset) => Promise<void>) {

	}

	async queryUnique(where: Clause_Where<DB_Asset>, transaction?: FirestoreTransaction): Promise<DB_Asset> {
		const dbAsset = await this.query.uniqueCustom({where});
		const signedUrl = (dbAsset.signedUrl?.validUntil || 0) > currentTimeMillis() ? dbAsset.signedUrl : undefined;
		if (!signedUrl) {
			const url = await ModuleBE_AssetsStorage.getReadSignedUrl(dbAsset);
			dbAsset.signedUrl = {
				url,
				validUntil: currentTimeMillis() + Day - Minute
			};
		}

		return dbAsset;
	}

	register = (key: string, validationConfig: FileTypeValidation) => {
		if (this.fileValidator[key] && this.fileValidator[key] !== validationConfig)
			throw new BadImplementationException(`File Validator already exists for key: ${key}`);

		this.fileValidator[key] = validationConfig;
	};

	__onCleanupSchedulerAct(): CleanupDetails {
		return {
			moduleKey: this.getName(),
			interval: Day,
			cleanup: () => this.cleanup(),
		};
	}

	private cleanup = async (interval = Hour, module = ModuleBE_AssetsTemp) => {
		const entries: DB_Asset[] = await module.query.custom({where: {timestamp: {$lt: currentTimeMillis() - interval}}});
		await Promise.all(entries.map(async dbAsset => {
			const file = await ModuleBE_AssetsStorage.getFile(dbAsset);
			if (!(await file.exists()))
				return;

			await file.delete();
		}));

		await module.delete.query({where: {timestamp: {$lt: currentTimeMillis() - interval}}});
	};

	getUrl = async (files: UI_Asset[]): Promise<TempSignedUrl[]> => {
		const bucketName = this.config?.bucketName;
		const bucket = await ModuleBE_AssetsStorage.storage.getOrCreateBucket(bucketName);
		return Promise.all(files.map(async _file => {
			const key = _file.key || _file.mimeType;

			// this will fail the entire request... should it?
			if (!this.fileValidator[key])
				throw new ImplementationMissingException(`Missing validator for type ${key}`);

			const _id = generateHex(32);
			const path = `${this.config.storagePath}/${_id}`;
			const dbAsset: DBProto_Assets['preDbType'] = {
				timestamp: currentTimeMillis(),
				_id,
				feId: _file.feId,
				name: _file.name,
				ext: _file.name.substring(_file.name.toLowerCase().lastIndexOf('.') + 1),
				mimeType: _file.mimeType,
				key,
				path,
				bucketName: bucket.bucketName
			};

			if (_file.public)
				dbAsset.public = _file.public;

			const dbTempMeta = await ModuleBE_AssetsTemp.set.item(dbAsset);
			const fileWrapper = await bucket.getFile(dbTempMeta.path);
			const url = await fileWrapper.getWriteSignedUrl(_file.mimeType, Hour);
			return {
				signedUrl: url.signedUrl,
				asset: dbTempMeta
			};
		}));
	};

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
		let dbTempAsset: DB_Asset;
		try {
			dbTempAsset = await ModuleBE_AssetsTemp.query.uniqueWhere({path: filePath});
		} catch (e) {
			return;
		}
		if (!dbTempAsset)
			throw new ThisShouldNotHappenException(`Could not find meta for file with path: ${filePath}`);

		await this.notifyFrontend(FileStatus.Processing, dbTempAsset);
		this.logDebug(`Found temp meta with _id: ${dbTempAsset._id}`, dbTempAsset);
		const validationConfig = this.fileValidator[dbTempAsset.key];
		if (!validationConfig)
			return this.notifyFrontend(FileStatus.ErrorNoConfig, dbTempAsset);

		let mimetypeValidator: FileValidator = DefaultMimetypeValidator;
		if (validationConfig.validator)
			mimetypeValidator = validationConfig.validator;

		if (!mimetypeValidator && validationConfig.fileType && validationConfig.fileType.includes(dbTempAsset.mimeType))
			mimetypeValidator = this.mimeTypeValidator[dbTempAsset.mimeType];

		if (!mimetypeValidator)
			return this.notifyFrontend(FileStatus.ErrorNoValidator, dbTempAsset);

		const file = await ModuleBE_AssetsStorage.getFile(dbTempAsset);
		try {
			const metadata = (await file.getDefaultMetadata()).metadata;
			if (!metadata)
				return this.notifyFrontend(FileStatus.ErrorRetrievingMetadata, dbTempAsset);

			await fileSizeValidator(file, metadata, validationConfig.minSize, validationConfig.maxSize);
			const fileType = await mimetypeValidator(file, dbTempAsset);

			dbTempAsset.md5Hash = metadata.md5Hash;
			if (fileType && dbTempAsset.ext !== fileType.ext) {
				this.logWarning(`renaming the file extension name: ${dbTempAsset.ext} => ${fileType.ext}`);
				dbTempAsset.ext = fileType.ext;
			}
		} catch (e: any) {
			//TODO delete the file and the temp doc
			this.logError(`Error while processing asset: ${dbTempAsset.name}`, e);
			return this.notifyFrontend(FileStatus.ErrorWhileProcessing, dbTempAsset);
		}

		if (dbTempAsset.public) {
			try {
				// need to handle the response status!
				await file.makePublic();
			} catch (e: any) {
				return this.notifyFrontend(FileStatus.ErrorMakingPublic, dbTempAsset);
			}
		}

		const finalDbAsset = await this.runTransaction(async (transaction): Promise<DB_Asset> => {
			const duplicatedAssets = await this.query.custom({where: {md5Hash: dbTempAsset.md5Hash}}, transaction);
			if (duplicatedAssets.length && duplicatedAssets[0]) {
				this.logWarning(`${dbTempAsset.feId} is a duplicated entry for ${duplicatedAssets[0]._id}`);
				return {...duplicatedAssets[0], feId: dbTempAsset.feId};
			}

			const doc = this.collection.doc.item(dbTempAsset);
			await ModuleBE_AssetsTemp.delete.unique(dbTempAsset._id, transaction);
			return await doc.set(dbTempAsset, transaction);
		});

		return this.notifyFrontend(FileStatus.Completed, finalDbAsset);
	};

	private notifyFrontend = async (status: FileStatus, asset: DB_Asset, feId?: string) => {
		if (status !== FileStatus.Completed && status !== FileStatus.Processing) {
			const message = `Error while processing asset: ${status}\n Failed on \n  Asset: ${asset.feId}\n    Key: ${asset.key}\n   Type: ${asset.mimeType}\n   File: ${asset.name}`;
			throw new ApiException(500, message);
		}

		this.logDebug(`notify FE about asset ${feId}: ${status}`);
		return PushMessageBE_FileUploadStatus.push({status, asset}, {feId: feId || asset.feId});
	};
}

export const ModuleBE_AssetsDB = new ModuleBE_AssetsDB_Class();




