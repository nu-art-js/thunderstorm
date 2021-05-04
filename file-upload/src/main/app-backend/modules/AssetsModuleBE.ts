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
	auditBy,
	BadImplementationException,
	currentTimeMillis,
	Day,
	dispatch_onServerError,
	generateHex,
	Hour,
	ImplementationMissingException,
	MB,
	Minute,
	ServerErrorSeverity,
	ThisShouldNotHappenException,
	TypedMap
} from "@nu-art/ts-common";
import {FileWrapper, FirebaseModule, FirebaseType_Metadata, StorageWrapper} from "@nu-art/firebase/backend";
import {BaseUploaderFile, DB_Asset, FileStatus, Push_FileUploaded, PushKey_FileUploaded, TempSecureUrl,} from "../../shared/types";
import {_assetValidator, AssetsTempModuleBE} from "./AssetsTempModuleBE";
import {PushPubSubModule} from "@nu-art/push-pub-sub/backend";
import {CleanupDetails, ExpressRequest, OnCleanupSchedulerAct} from "@nu-art/thunderstorm/backend";
import {fromBuffer} from "file-type";
import {FileTypeResult} from "file-type/core";
import {Clause_Where, FirestoreQuery} from "@nu-art/firebase";
import {BaseDB_ApiGenerator, Config} from "@nu-art/db-api-generator/backend";


type MyConfig = Config<DB_Asset> & {
	bucketName?: string
	path: string
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

export class AssetsModuleBE_Class
	extends BaseDB_ApiGenerator<DB_Asset, MyConfig>
	implements OnCleanupSchedulerAct {

	constructor() {
		super("assets", _assetValidator, "assets");
		this.setDefaultConfig({...this.config, path: "assets"});
	}

	private storage!: StorageWrapper;

	mimeTypeValidator: TypedMap<FileValidator> = {};
	fileValidator: TypedMap<FileTypeValidation> = {};

	registerTypeValidator(mimeType: string, validator: (file: FileWrapper, doc: DB_Asset) => Promise<void>) {

	}

	async queryUnique(where: Clause_Where<DB_Asset>, request?: ExpressRequest): Promise<DB_Asset> {
		const asset = await super.queryUnique(where, request);
		const signedUrl = (asset.signedUrl?.validUntil || 0) > currentTimeMillis() ? asset.signedUrl : undefined;
		if (!signedUrl) {
			const url = await (await this.storage.getFile(asset.path, asset.bucketName)).getReadSecuredUrl(asset.mimeType, Day);
			asset.signedUrl = {
				url: url.securedUrl,
				validUntil: currentTimeMillis() + Day - Minute
			}
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
			cleanup: this.cleanup
		};
	}

	private cleanup = async (interval = Hour, module: BaseDB_ApiGenerator<DB_Asset> = AssetsTempModuleBE) => {
		const entries: DB_Asset[] = await module.query({where: {timestamp: {$lt: currentTimeMillis() - interval}}});
		const bucketName = this.config?.bucketName;
		const bucket = await this.storage.getOrCreateBucket(bucketName);
		await Promise.all(entries.map(async dbAsset => {
			const file = await bucket.getFile(dbAsset.path);
			if (!(await file.exists()))
				return;

			await file.delete();
		}));

		return module.delete({where: {timestamp: {$lt: currentTimeMillis() - interval}}});
	};

	init() {
		super.init();
		this.storage = FirebaseModule.createAdminSession("file-uploader").getStorage();
	}

	async getUrl(files: BaseUploaderFile[]): Promise<TempSecureUrl[]> {
		const bucketName = this.config?.bucketName;
		const bucket = await this.storage.getOrCreateBucket(bucketName);
		return Promise.all(files.map(async _file => {
			const key = _file.key || _file.mimeType;

			// this will fail the entire request... should it?
			if (!this.fileValidator[key])
				throw new ImplementationMissingException(`Missing validator for type ${key}`);

			const _id = generateHex(32);
			const path = `${this.config.path}/${_id}`;
			const dbAsset: DB_Asset = {
				timestamp: currentTimeMillis(),
				_id,
				feId: _file.feId,
				name: _file.name,
				ext: _file.name.substring(_file.name.toLowerCase().lastIndexOf(".") + 1),
				mimeType: _file.mimeType,
				key,
				path,
				_audit: auditBy('be-stub'),
				bucketName: bucket.bucketName
			};

			if (_file.public)
				dbAsset.public = _file.public;

			const dbTempMeta = await AssetsTempModuleBE.upsert(dbAsset);
			const fileWrapper = await bucket.getFile(dbTempMeta.path);
			const url = await fileWrapper.getWriteSecuredUrl(_file.mimeType, Hour);
			return {
				secureUrl: url.securedUrl,
				asset: dbTempMeta
			};
		}));
	}

	processAssetManually = async (feId?: string) => {
		let query: FirestoreQuery<DB_Asset> = {limit: 1};
		if (feId)
			query = {where: {feId}};

		const unprocessedFiles: DB_Asset[] = await AssetsTempModuleBE.query(query);
		return Promise.all(unprocessedFiles.map(asset => this.processAsset(asset.path)));
	};

	processAsset = async (filePath?: string) => {
		if (!filePath)
			throw new ThisShouldNotHappenException('Missing file path');

		this.logInfo(`Looking for file with path: ${filePath}`);
		const tempMeta = await AssetsTempModuleBE.queryUnique({path: filePath});
		if (!tempMeta)
			throw new ThisShouldNotHappenException(`Could not find meta for file with path: ${filePath}`);

		await this.notifyFrontend(FileStatus.Processing, tempMeta);
		this.logInfo(`Found temp meta with _id: ${tempMeta._id}`, tempMeta);
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
		} catch (e) {
			//TODO delete the file and the temp doc
			return this.notifyFrontend(FileStatus.ErrorWhileProcessing, tempMeta);
		}

		if (tempMeta.public) {
			try {
				// need to handle the response status!
				await file.makePublic();
			} catch (e) {
				return this.notifyFrontend(FileStatus.ErrorMakingPublic, tempMeta);
			}
		}

		const finalDbAsset = await this.runInTransaction(async (transaction): Promise<DB_Asset> => {
			const duplicatedAssets = await this.query({where: {md5Hash: tempMeta.md5Hash}});
			if (duplicatedAssets.length && duplicatedAssets[0]) {
				this.logInfo(`${tempMeta.feId} is a duplicated entry for ${duplicatedAssets[0]._id}`);
				return {...duplicatedAssets[0], feId: tempMeta.feId};
			}

			const upsertWrite = await this.upsert_Read(tempMeta, transaction);
			await AssetsTempModuleBE.deleteUnique(tempMeta._id, transaction);
			return upsertWrite();
		});

		return this.notifyFrontend(FileStatus.Completed, finalDbAsset);
	};

	private notifyFrontend = async (status: FileStatus, asset: DB_Asset, feId?: string) => {
		if (status !== FileStatus.Completed && status !== FileStatus.Processing) {
			const message = `Error while processing asset: ${status}\n Failed on \n  Asset: ${asset.feId}\n    Key: ${asset.key}\n   Type: ${asset.mimeType}\n   File: ${asset.name}`;
			await dispatch_onServerError.dispatchModuleAsync([ServerErrorSeverity.Error, this, message]);
		}

		return PushPubSubModule.pushToKey<Push_FileUploaded>(PushKey_FileUploaded, {feId: feId || asset.feId}, {status, asset});
	};
}


export const AssetsModuleBE = new AssetsModuleBE_Class();




