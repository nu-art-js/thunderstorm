import {
	__stringify,
	_keys,
	_logger_logException,
	ApiException,
	BadImplementationException,
	currentTimeMillis,
	Day,
	Dispatcher,
	filterInstances,
	Format_YYYYMMDD_HHmmss,
	formatTimestamp,
	LogLevel,
	Minute,
	Module,
	PreDB,
	RuntimeModules,
	sortArray,
	TS_Object,
	TypedMap,
	UniqueId
} from '@nu-art/ts-common';
import {DBApiConfigV3, ModuleBE_BaseDBV3} from '../../../backend/modules/db-api-gen/ModuleBE_BaseDBV3';
import {ModuleBE_BaseDBV2} from '../../../backend/modules/db-api-gen/ModuleBE_BaseDBV2';
import {END_OF_STREAM, ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {_EmptyQuery, FirestoreQuery} from '@nu-art/firebase';
import {CSVModule} from '@nu-art/ts-common/modules/CSVModule';
import {Readable, Writable} from 'stream';
import {FirestoreCollectionV3} from '@nu-art/firebase/backend/firestore-v3/FirestoreCollectionV3';
import {BackupMetaData, DB_BackupDoc, DBProto_BackupDoc, FetchBackupDoc} from '../shared/types';
import {addRoutes} from '../../../backend/modules/ModuleBE_APIs';
import {ApiDef_BackupDoc, Request_BackupId, Response_BackupDocs} from '../shared/api-def';
import {createQueryServerApi} from '../../../backend/core/typed-api';
import {DBDef_BackupDoc} from '../shared/db-def';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {MemKey_HttpRequestHeaders} from '../../../backend/modules/server/consts';
import {ApiDef, HttpMethod, QueryApi} from '../../../shared';
import {AxiosHttpModule} from '../../../backend';


export interface OnModuleCleanupV2 {
	__onCleanupInvokedV2: () => Promise<void>;
}

const dispatch_onModuleCleanupV2 = new Dispatcher<OnModuleCleanupV2, '__onCleanupInvokedV2'>('__onCleanupInvokedV2');

type Config = DBApiConfigV3<DBProto_BackupDoc> & {
	keepInterval: number,
	minTimeThreshold: number,
	excludedCollectionNames?: string[],
}

const CSVConfig = {
	fieldSeparator: ',',
	quoteStrings: '',
	decimalSeparator: '.',
	showLabels: true,
	showTitle: false,
	useTextFile: false,
	useBom: true,
	useKeysAsHeaders: true,
};

type DBModules = ModuleBE_BaseDBV2<any> | ModuleBE_BaseDBV3<any>;
type BackRowCSV = { collectionName: string, _id: string, document: string };

type IterateOnBackupParams = {
	stream: Readable,
	chunkSize: number,
	filter: (collectionName: string) => boolean,
	process: (row: BackRowCSV) => void,
	paginate: () => Promise<any>
}

/**
 * This module is in charge of making a backup of the db in firebase storage,
 * in order to test this module locally run firebase functions:shell command in a terminal
 * when the firebase> shows up write the name of the function you want to run and call it "functionName()"
 * **/
export class ModuleBE_BackupDocDB_Class
	extends Module<Config> {

	public collection!: FirestoreCollectionV3<DBProto_BackupDoc>;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);
		this.setDefaultConfig({minTimeThreshold: Day, keepInterval: 7 * Day});
	}

	protected init(): void {
		super.init();
		this.collection = this.getBackupStatusCollection();
		addRoutes([
			createQueryServerApi(ApiDef_BackupDoc._v1.initiateBackup, () => this.initiateBackup()),
			createQueryServerApi(ApiDef_BackupDoc._v1.fetchBackupDocs, this.fetchBackupDocs),
		]);
	}

	/**
	 * @param body - needs to contain backupId with the key to fetch.
	 */
	fetchBackupDocs = async (body: Request_BackupId): Promise<Response_BackupDocs> => {
		const backupDoc = await this.queryUnique(body.backupId);

		if (!backupDoc)
			throw new ApiException(500, `no backupdoc found with this id ${body.backupId}`);

		return await this.fetchDocImpl(backupDoc);

	};

	fetchLatestBackupDoc = async (): Promise<Response_BackupDocs> => {
		const docs = await this.query(_EmptyQuery);
		if (!docs.length)
			throw HttpCodes._4XX.NOT_FOUND('No backups to fetch', 'No backups in db to fetch');

		const latest = sortArray(docs, doc => doc.__created, true)[0];
		return await this.fetchDocImpl(latest);
	};

	private fetchDocImpl = async (doc: DB_BackupDoc) => {
		const bucket = await ModuleBE_Firebase.createAdminSession().getStorage().getMainBucket();
		const contentType = MemKey_HttpRequestHeaders.get()['content-type'];
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

	public getBackupStatusCollection = (): FirestoreCollectionV3<DBProto_BackupDoc> => {
		return ModuleBE_Firebase
			.createAdminSession()
			.getFirestoreV3()
			.getCollection(DBDef_BackupDoc);
	};

	/**
	 * Get metadata objects per each collection module that needs to be backed up.
	 */
	public getBackupDetails = (): DBModules[] => {
		return RuntimeModules()
			.filter((module) => {
				if (!module || !module.dbDef)
					return false;

				if (this.config.excludedCollectionNames?.includes(module.config.collectionName)) {
					this.logWarningBold(`Skipping module ${module.config.collectionName} since it's in the exclusion list.`);
					return false;
				}

				return true;
			});
	};

	private formatToCsv = (docArray: TS_Object[], moduleKey: string) => {
		return docArray.map(doc => ({
			collectionName: moduleKey,
			_id: doc._id,
			document: `"${__stringify(doc)}"`
		}));
	};

	initiateBackup = async (force = false) => {
		const nowMs = currentTimeMillis();
		const timeFormat = formatTimestamp(Format_YYYYMMDD_HHmmss, nowMs);
		const backupPath = `backup/${timeFormat}/firestore-backup.csv`;
		const metadataPath = `backup/${timeFormat}/metadata.json`;
		const configPath = `backup/${timeFormat}/firebase-backup.json`;

		const query: FirestoreQuery<DB_BackupDoc> = {
			where: {},
			orderBy: [{key: 'timestamp', order: 'asc'}],
			limit: 1
		};

		const docs = await this.query(query);
		const latestDoc = docs[0];

		if (!force && latestDoc && latestDoc.timestamp + this.config.minTimeThreshold > nowMs)
			return; // If the oldest doc is still in the keeping timeframe, don't delete any docs.

		if (this.config.excludedCollectionNames)
			this.logInfo(`Found excluded modules list: ${this.config.excludedCollectionNames}`);

		try {
			this.logInfo('Cleaning modules...');
			await dispatch_onModuleCleanupV2.dispatchModuleAsync();
			this.logInfo('Cleaned modules!');
		} catch (e: any) {
			this.logWarning(`modules cleanup has failed with error`, e);
			const errorMessage = `modules cleanup has failed with error\nError: ${_logger_logException(e)}`;
			throw new ApiException(500, errorMessage, e);
		}

		const modules: DBModules[] = filterInstances(this.getBackupDetails());
		let backupsCounter = 0;

		const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
		const storage = firebaseSessionAdmin.getStorage();
		const bucket = await storage.getMainBucket();
		const fullPathToBackup = `${bucket.getBucketName()}/${backupPath}`;
		CSVModule.updateExporterSettings(CSVConfig);
		const metadata: BackupMetaData = {collectionsData: [], timestamp: nowMs};

		if (modules.length === 0)
			throw new ApiException(404, 'No modules to backup');

		const backupFeeder = async (writable: Writable) => {
			if (!modules[backupsCounter])
				return END_OF_STREAM;

			const currentModule = modules[backupsCounter];

			let page = 0;
			let docCounter = 0;
			let data;

			const moduleKey = currentModule.config.collectionName;
			do {

				//Get the next chunk of documents from the db module
				data = await currentModule.query.custom({
					..._EmptyQuery,
					limit: {page, itemsCount: 1000}
				});

				// If no data there's no need to process or write anything to csv
				if (data.length) {

					//Upgrade documents to latest version
					await currentModule.upgradeInstances(data);

					// Write the new data to the csv
					data = this.formatToCsv(data, moduleKey);

					const csv = CSVModule.export(data);

					if (page === 0)
						CSVModule.updateExporterSettings({
							...CSVConfig,
							showLabels: false,
							useKeysAsHeaders: false
						});

					writable.write(csv.toString());
				}

				docCounter += data.length;
				page++;
			} while (data.length);

			metadata.collectionsData.push({
				collectionName: moduleKey,
				numOfDocs: docCounter,
				version: currentModule.dbDef.versions[0]
			});

			backupsCounter++;

		};

		try {
			this.logDebug('Creating backup file...');
			const file = await bucket.getFile(backupPath);
			await file.writeToStream(backupFeeder);
			this.logDebug('Backup file created');

			this.logDebug('Backing up config db');
			const database = firebaseSessionAdmin.getDatabase();
			const configBackup = await database.ref('/').get();
			const configFile = await bucket.getFile(configPath);
			await configFile.write(configBackup as object);
			this.logDebug('Config file created');

			this.logDebug('Creating metadata file...');
			const metadataFile = await bucket.getFile(metadataPath);
			await metadataFile.write(metadata);
			this.logDebug('Metadata file created');
		} catch (e: any) {
			this.logWarning(`backup of ${modules[backupsCounter].config.collectionName} has failed with error`, e);
			const errorMessage = `Error backing up firestore collection config:\n ${__stringify(modules[backupsCounter].config, true)}\nError: ${_logger_logException(e)}`;
			throw new ApiException(500, errorMessage, e);
		}

		const dbBackup = await this.upsert({
			timestamp: nowMs,
			backupPath,
			metadataPath,
			firebasePath: configPath,
			metadata
		});
		this.logWarning(dbBackup);

		const oldBackupsToDelete = await this.query({where: {timestamp: {$lt: nowMs - this.config.keepInterval}}});
		if (oldBackupsToDelete.length === 0) {
			this.logInfoBold('No older backups to delete');
			return {pathToBackup: fullPathToBackup, backupId: dbBackup._id};
		}

		try {
			this.logInfoBold('Received older backups to delete, count: ' + oldBackupsToDelete.length);
			await Promise.all(oldBackupsToDelete.map(async oldDoc => (filterInstances([oldDoc.metadataPath, oldDoc.backupPath, oldDoc.firebasePath])
				.map(async path => (await bucket.getFile(path)).delete()))));
			await this.collection.delete.all(oldBackupsToDelete);
			this.logInfoBold('Successfully deleted old backups');
		} catch (err: any) {
			this.logWarning(`Error while cleaning up older backups`, err);
			throw new ApiException(500, err);
		}

		return {pathToBackup: fullPathToBackup, backupId: dbBackup._id};
	};

	// private async getBackupInfo(queryParams: Request_GetMetadata) {
	async getBackupInfo(backupId: string, baseUrl: string, headers: TypedMap<string | string[]>) {
		const url: string = `${baseUrl}/v1/fetch-backup-docs-v2`;
		const outputDef: ApiDef<QueryApi<Response_BackupDocs, Request_BackupId>> = {
			method: HttpMethod.GET,
			path: '',
			fullUrl: url
		};
		const requestBody = {backupId};

		try {
			let request = AxiosHttpModule
				.createRequest(outputDef)
				.setUrlParams(requestBody);

			request = request.addHeaders(headers);

			const response: Response_BackupDocs = await request.executeSync();
			const backupInfo = response.backupInfo;

			const wrongBackupIdDescriptor = backupInfo?._id !== backupId;

			if (wrongBackupIdDescriptor)
				throw new BadImplementationException(`Received backup descriptors with wrong backupId! provided id: ${backupId} received id: ${backupInfo?._id}`);

			return backupInfo;
		} catch (err: any) {
			throw new ApiException(500, err);
		}
	}

	getBackupStreamFromId = async (backupInfo: FetchBackupDoc) => {
		if (!backupInfo.backupFilePath)
			throw new ApiException(404, 'Backup file path not found');

		this.logInfo(`----  Fetching Backup Stream from: ${backupInfo.firestoreSignedUrl} ----`);
		const signedUrlDef: ApiDef<QueryApi<any>> = {
			method: HttpMethod.GET,
			path: '',
			fullUrl: backupInfo.firestoreSignedUrl
		};

		return (await AxiosHttpModule
			.createRequest(signedUrlDef)
			.setResponseType('stream')
			.executeSync()) as Readable;
	};

	iterateOnBackup = async (params: IterateOnBackupParams) => {
		const startSync = performance.now(); // required for log

		this.logInfo(`----  Iterating on Backup... ----`);
		let totalItems = 0;
		let batchItemsCounter = 0;
		let totalItemsCollected = 0;

		await CSVModule.forEachCsvRowFromStreamSync(params.stream, (row: any, index: number, transform) => {
			_keys(row).map(key => {
				row[(key as string).trim()] = (row[key] as string).trim();
			});

			if (!params.filter(row.collectionName))
				return;

			totalItems++;
			params.process(row);
			batchItemsCounter++;
			if (batchItemsCounter < params.chunkSize)
				return;

			this.logInfo(`calling pause`);
			transform.pause();
			const prevLimitCounter = batchItemsCounter;
			batchItemsCounter = 0;

			params.paginate().then(() => {
				this.logInfo(`committed ${prevLimitCounter} items`);
				totalItemsCollected += prevLimitCounter;

				transform.resume();
			}).catch(err => this.logError('error committing batch', err));
		});

		if (batchItemsCounter > 0) {
			await params.paginate();
			totalItemsCollected += batchItemsCounter;
		}
		this.logInfo(`---- DONE Syncing Firestore: (${totalItemsCollected}/${totalItems})----`);
		const endSync = performance.now(); // required for log
		this.logInfo(`SyncingEnv took ${((endSync - startSync) / 1000).toFixed(3)} seconds`);
	};
	query = async (ourQuery: FirestoreQuery<DB_BackupDoc>): Promise<DB_BackupDoc[]> => {
		return await this.collection.query.custom(ourQuery);
	};

	queryUnique = async (backupDocId: UniqueId) => {
		return await this.collection.query.unique(backupDocId);
	};

	upsert = async (instance: PreDB<DB_BackupDoc>): Promise<DB_BackupDoc> => {
		return await this.collection.create.item(instance);
	};

	deleteItem = async (instance: DB_BackupDoc): Promise<DB_BackupDoc | undefined> => {
		return await this.collection.delete.unique(instance._id);
	};
}

export const ModuleBE_BackupDocDB = new ModuleBE_BackupDocDB_Class();
