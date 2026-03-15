/*
 * @nu-art/backup-backend - Backup doc DB and HTTP API
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	__stringify,
	_logger_logException,
	ApiException,
	BadImplementationException,
	cloneObj,
	currentTimeMillis,
	Day,
	filterInstances,
	Format_YYYYMMDD_HHmmss,
	formatTimestamp,
	LogLevel,
	Minute,
	Module,
	PreDB,
	sortArray,
	TypedMap,
	UniqueId
} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {_EmptyQuery, FirestoreQuery} from '@nu-art/firebase-shared';
import {Readable} from 'stream';
import type {FirestoreCollectionV3} from '@nu-art/firebase-backend';
import {ApiHandler} from '@nu-art/http-server';
import {
	ApiDef_BackupDoc,
	DB_BackupDoc,
	DBDef_BackupDoc,
	DatabaseDef_BackupDoc,
	Request_BackupId,
	Response_BackupDocs,
	BackupMetaData,
	FetchBackupDoc
} from '@nu-art/backup-shared';
import {CSVModuleV3} from '@nu-art/ts-common/modules/CSVModuleV3';
import type {BackupableModule, BackupDocDBConfig} from './types.js';

const DayDefault = Day;
const KeepIntervalDefault = 7 * Day;

export class ModuleBE_BackupDocDB_Class
	extends Module<BackupDocDBConfig> {

	public collection!: FirestoreCollectionV3<DatabaseDef_BackupDoc>;
	private resolvedConfig!: BackupDocDBConfig;

	constructor(config?: BackupDocDBConfig) {
		super();
		this.setMinLevel(LogLevel.Verbose);
		this.setDefaultConfig({
			minTimeThreshold: DayDefault,
			keepInterval: KeepIntervalDefault,
			...config
		});
	}

	/** Call before init() to provide modules and optional hooks. */
	configureBackup(config: BackupDocDBConfig): void {
		this.resolvedConfig = config;
		this.setDefaultConfig(config);
	}

	protected init(): void {
		super.init();
		this.resolvedConfig = this.config as BackupDocDBConfig;
		if (!this.resolvedConfig?.getModulesToBackup)
			throw new BadImplementationException('BackupDocDB: setConfig({ getModulesToBackup }) required before init');
		this.collection = this.getBackupStatusCollection();
	}

	public getBackupStatusCollection = (): FirestoreCollectionV3<DatabaseDef_BackupDoc> => {
		return ModuleBE_Firebase
			.createAdminSession()
			.getFirestoreV3()
			.getCollection(DBDef_BackupDoc);
	};

	public getBackupDetails = (): BackupableModule[] => {
		return filterInstances(
			this.resolvedConfig.getModulesToBackup().filter((module) => {
				if (!module?.dbDef)
					return false;
				if (this.resolvedConfig.excludedDbKeys?.includes(module.dbDef.dbKey)) {
					this.logWarningBold(`Skipping module ${module.dbDef.dbKey} since it's in the exclusion list.`);
					return false;
				}
				return true;
			})
		);
	};

	async getBackupInfo(backupId: string, baseUrl: string, headers: TypedMap<string | string[]>): Promise<FetchBackupDoc> {
		const httpClient = this.resolvedConfig.httpClient;
		if (!httpClient)
			throw new BadImplementationException('BackupDocDB: getBackupInfo requires config.httpClient');

		const url = `${baseUrl}/v1/fetch-backup-docs-v2`;
		const requestBody = {backupId};
		const req = httpClient.createRequest({method: 'get', path: url, queryParams: requestBody});
		const request = req.addHeaders ? req.addHeaders(headers as TypedMap<string>) : req;
		const response = (await request.executeSync()) as Response_BackupDocs;
		const backupInfo = response.backupInfo;

		if (backupInfo?._id !== backupId)
			throw new BadImplementationException(`Received backup descriptors with wrong backupId! provided id: ${backupId} received id: ${backupInfo?._id}`);

		return backupInfo;
	}

	getBackupStreamFromId = async (backupInfo: FetchBackupDoc): Promise<Readable> => {
		if (!backupInfo.backupFilePath)
			throw new ApiException(404, 'Backup file path not found');

		this.logInfo(`----  Fetching Backup Stream from: ${backupInfo.firestoreSignedUrl} ----`);
		const httpClient = this.resolvedConfig.httpClient;
		if (!httpClient)
			throw new BadImplementationException('BackupDocDB: getBackupStreamFromId requires config.httpClient');

		const req = httpClient.createRequest({method: 'get', path: backupInfo.firestoreSignedUrl});
		const request = req.setResponseType ? req.setResponseType('stream') : req;
		return (await request.executeSync()) as Readable;
	};

	query = async (ourQuery: FirestoreQuery<DB_BackupDoc>): Promise<DB_BackupDoc[]> => {
		return await this.collection.query.custom(ourQuery);
	};

	queryUnique = async (backupDocId: UniqueId): Promise<DB_BackupDoc | undefined> => {
		return await this.collection.query.unique(backupDocId as DB_BackupDoc['_id']);
	};

	upsert = async (instance: PreDB<DB_BackupDoc>): Promise<DB_BackupDoc> => {
		return await this.collection.create.item(instance);
	};

	deleteItem = async (instance: DB_BackupDoc): Promise<DB_BackupDoc | undefined> => {
		return await this.collection.delete.unique(instance._id);
	};

	private getDefaultPath = (): string => {
		const nowMs = currentTimeMillis();
		const timeFormat = formatTimestamp(Format_YYYYMMDD_HHmmss, nowMs);
		return `backup/${timeFormat}`;
	};

	@ApiHandler(ApiDef_BackupDoc.initiateBackup)
	async initiateBackup(payload?: { pathToBackup?: string } | boolean): Promise<{ pathToBackup: string; backupId: string } | undefined> {
		const force = payload === true;
		const queryParams = typeof payload === 'object' && payload !== null ? payload : undefined;
		const pathInBucket = queryParams?.pathToBackup ?? this.getDefaultPath();
		const nowMs = currentTimeMillis();
		const backupPath = `${pathInBucket}/firestore-backup.csv`;
		const metadataPath = `${pathInBucket}/metadata.json`;
		const configPath = `${pathInBucket}/firebase-backup.json`;

		const backupQuery: FirestoreQuery<DB_BackupDoc> = {
			where: {},
			orderBy: [{key: 'timestamp', order: 'asc'}],
			limit: 1
		};

		const docs = await this.query(backupQuery);
		const latestDoc = docs[0];
		const minThreshold = this.resolvedConfig.minTimeThreshold ?? this.config.minTimeThreshold ?? DayDefault;

		if (!force && latestDoc && latestDoc.timestamp + minThreshold > nowMs)
			return undefined;

		if (this.resolvedConfig.excludedDbKeys)
			this.logInfo(`Found excluded modules list: ${this.resolvedConfig.excludedDbKeys}`);

		try {
			this.logInfo('Cleaning modules...');
			await this.resolvedConfig.onCleanup?.();
			this.logInfo('Cleaned modules!');
		} catch (e: unknown) {
			this.logWarning('modules cleanup has failed with error', e as Error);
			const errorMessage = `modules cleanup has failed with error\nError: ${_logger_logException(e instanceof Error ? e : new Error(String(e)))}`;
			throw new ApiException(500, errorMessage, e instanceof Error ? e : new Error(String(e)));
		}

		const modules = this.getBackupDetails();
		let backupsCounter = 0;

		try {
			this.logInfo('Upgrading Collections');
			await this.resolvedConfig.upgradeCollections?.();
			this.logInfo('Collections Upgraded');
		} catch (e: unknown) {
			this.logError(e as Error);
			throw HttpCodes._5XX.INTERNAL_SERVER_ERROR('Could not upgrade collections', 'failed collection upgrade', e as Error);
		}

		const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
		const storage = firebaseSessionAdmin.getStorage();
		const bucket = await storage.getMainBucket();
		let metadata: BackupMetaData;

		if (modules.length === 0)
			throw new ApiException(404, 'No modules to backup');

		try {
			this.logDebug('Creating backup file...');
			const file = await bucket.getFile(backupPath);
			const reader = new DBModuleReader(modules);
			const writer = file.createWriteStream({gzip: true});
			const formatter = CSVModuleV3.provideFormatter();
			await new Promise<void>((resolve, reject) => {
				reader
					.pipe(formatter)
					.pipe(writer)
					.on('close', () => {
						metadata = {...reader.getMetadata(), timestamp: nowMs};
						resolve();
					})
					.on('error', err => reject(err));
			});

			this.logDebug('Backup file created');
			this.logDebug('Backing up config db');
			const database = firebaseSessionAdmin.getDatabase();
			const configBackup = await database.ref('/').get();
			const configFile = await bucket.getFile(configPath);
			await configFile.write(configBackup as object);
			this.logDebug('Config file created');

			this.logDebug('Creating metadata file...');
			const metadataFile = await bucket.getFile(metadataPath);
			await metadataFile.write(metadata!);
			this.logDebug('Metadata file created');
		} catch (e: unknown) {
			const mod = modules[backupsCounter];
			this.logWarning(`backup of ${mod?.dbDef.dbKey} has failed with error`, e as Error);
			const errorMessage = `Error backing up firestore collection config:\n ${__stringify(mod?.dbDef.dbKey, true)}\nError: ${_logger_logException(e instanceof Error ? e : new Error(String(e)))}`;
			throw new ApiException(500, errorMessage, e instanceof Error ? e : new Error(String(e)));
		}

		const dbBackup = await this.upsert({
			timestamp: nowMs,
			backupPath,
			metadataPath,
			firebasePath: configPath,
			metadata: metadata!
		});
		this.logWarning(dbBackup);

		const keepInterval = this.resolvedConfig.keepInterval ?? this.config.keepInterval ?? KeepIntervalDefault;
		const oldBackupsToDelete = await this.query({where: {timestamp: {$lt: nowMs - keepInterval}}});
		if (oldBackupsToDelete.length === 0) {
			this.logInfoBold('No older backups to delete');
			return {pathToBackup: backupPath, backupId: dbBackup._id};
		}

		try {
			this.logInfoBold('Received older backups to delete, count: ' + oldBackupsToDelete.length);
			const backupDeleteOperations = oldBackupsToDelete
				.map(doc => filterInstances([doc.metadataPath, doc.backupPath, doc.firebasePath]))
				.flat()
				.map(path => async () => {
					try {
						const file = await bucket.getFile(path);
						file.delete();
					} catch (err: unknown) {
						this.logError(`Failed deleting file at path: ${path}`, err as Error);
					}
				});
			await Promise.all(backupDeleteOperations);
			await this.collection.delete.all(oldBackupsToDelete.map(doc => doc._id));
			this.logInfoBold('Successfully deleted old backups');
		} catch (err: unknown) {
			this.logWarning('Error while cleaning up older backups', err as Error);
			throw new ApiException(500, 'Error while cleaning up older backups', err instanceof Error ? err : new Error(String(err)));
		}

		return {pathToBackup: backupPath, backupId: dbBackup._id};
	};

	createBackupReadStream = async (backupInfo: FetchBackupDoc): Promise<Readable> => {
		const stream = await this.getBackupStreamFromId(backupInfo);
		const transformer = CSVModuleV3.provideFormatterFromCsv();
		return stream.pipe(transformer);
	};

	createBackupReadStreamFromBucket = async (pathInBucket: string): Promise<Readable> => {
		const file = await ModuleBE_Firebase.createAdminSession().getStorage().getFile(pathInBucket);
		const stream = file.createReadStream({decompress: true});
		const transformer = CSVModuleV3.provideFormatterFromCsv();
		return stream.pipe(transformer);
	};

	@ApiHandler(ApiDef_BackupDoc.fetchBackupDocs)
	async fetchBackupDocs(body: Request_BackupId): Promise<Response_BackupDocs> {
		const backupDoc = await this.queryUnique(body.backupId);

		if (!backupDoc)
			throw new ApiException(500, `no backup doc found with this id ${body.backupId}`);

		return await this.fetchDocImpl(backupDoc);
	};

	fetchLatestBackupDoc = async (): Promise<Response_BackupDocs> => {
		const docs = await this.query(_EmptyQuery);
		if (!docs.length)
			throw HttpCodes._4XX.NOT_FOUND('No backups to fetch', 'No backups in db to fetch');

		const latest = sortArray(docs, doc => doc.__created, true)[0];
		return await this.fetchDocImpl(latest);
	};

	private fetchDocImpl = async (doc: DB_BackupDoc): Promise<Response_BackupDocs> => {
		const bucket = await ModuleBE_Firebase.createAdminSession().getStorage().getMainBucket();
		const contentType = this.resolvedConfig.getSignedUrlContentType?.() ?? 'application/octet-stream';
		const firebaseDescriptor = await (await bucket.getFile(doc.firebasePath)).getReadSignedUrl(10 * Minute, contentType);
		const firestoreDescriptor = await (await bucket.getFile(doc.backupPath)).getReadSignedUrl(10 * Minute, contentType);

		return {
			backupInfo: {
				_id: doc._id,
				backupFilePath: doc.backupPath,
				metadataFilePath: doc.metadataPath,
				firebaseFilePath: doc.firebasePath,
				firebaseSignedUrl: firebaseDescriptor.signedUrl,
				firestoreSignedUrl: firestoreDescriptor.signedUrl,
				metadata: doc.metadata
			}
		};
	};
}

export const ModuleBE_BackupDocDB = new ModuleBE_BackupDocDB_Class();

class DBModuleReader
	extends Readable {

	readonly dbModules: BackupableModule[];
	readonly pageSize: number;
	private page = 0;
	private moduleIndex = 0;
	private done = false;
	private metadata: BackupMetaData;

	constructor(dbModules: BackupableModule[], pageSize = 1000) {
		super({objectMode: true});
		this.dbModules = dbModules;
		this.pageSize = pageSize;
		this.metadata = {collectionsData: [], timestamp: currentTimeMillis()};
	}

	public getMetadata = (): BackupMetaData => cloneObj(this.metadata);

	private updateMetadata = (module: BackupableModule, items: unknown[]): void => {
		const dbKey = module.dbDef.dbKey;
		const collectionData = this.metadata.collectionsData.find(data => data.dbKey === dbKey);
		if (!collectionData)
			this.metadata.collectionsData.push({
				dbKey: module.dbDef.dbKey,
				numOfDocs: items.length,
				version: module.dbDef.versions[0]
			});
		else
			collectionData.numOfDocs += items.length;
	};

	private getItems = async (): Promise<{ dbKey: string; _id: string; document: string }[] | undefined> => {
		if (this.done)
			return undefined;

		const module = this.dbModules[this.moduleIndex];
		if (!module) {
			this.done = true;
			return undefined;
		}

		const dbKey = module.dbDef.dbKey;
		try {
			const items = await module.query.unManipulatedQuery({
				..._EmptyQuery,
				limit: {page: this.page, itemsCount: this.pageSize}
			});
			this.updateMetadata(module, items);
			return items.map((item: { _id: string }) => ({
				dbKey,
				_id: item._id,
				document: JSON.stringify(item)
			}));
		} catch (err: unknown) {
			this.emit('error', err instanceof Error ? err : new Error(String(err)));
			return undefined;
		}
	};

	private advanceModule = (): void => {
		this.page = 0;
		this.moduleIndex++;
	};

	override async _read(): Promise<void> {
		const items = await this.getItems();
		if (!items) {
			this.push(null);
			return;
		}

		if (!items.length) {
			this.advanceModule();
			await this._read();
			return;
		}

		items.forEach(item => this.push(item));

		if (items.length < this.pageSize)
			this.advanceModule();
		else
			this.page++;
	}
}
