import {
	_keys,
	ApiException,
	BadImplementationException,
	Dispatcher,
	Minute,
	Module,
	MUSTNeverHappenException,
	RuntimeModules,
	TypedMap
} from '@nu-art/ts-common';
import {CSVModule} from '@nu-art/ts-common/modules/CSVModule';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {addRoutes} from '../ModuleBE_APIs';
import {createBodyServerApi, createQueryServerApi} from '../../core/typed-api';
import {
	ApiDef,
	ApiDef_SyncEnvV2,
	ApiModule,
	DBModuleType,
	HttpMethod,
	QueryApi,
	Request_BackupId,
	Request_FetchFirebaseBackup,
	Request_FetchFromEnvV2,
	Request_GetMetadata,
	Response_BackupDocs,
	Response_FetchBackupMetadata
} from '../../../shared';
import {AxiosHttpModule} from '../http/AxiosHttpModule';
import {MemKey_HttpRequest} from '../server/consts';
import {ModuleBE_BaseApiV3_Class} from '../db-api-gen/ModuleBE_BaseApiV3';
import {Readable} from 'stream';
import {Storm} from '../../core/Storm';
import {ModuleBE_BackupDocDB} from '../../../_entity/backup-doc/backend';
import {ModuleBE_BaseDBV3} from '../db-api-gen/ModuleBE_BaseDBV3';


type Config = {
	urlMap: TypedMap<string>
	fetchBackupDocsSecretsMap: TypedMap<string>,
	sessionMap: TypedMap<TypedMap<string>>,
	maxBatch: number
	shouldBackupBeforeSync?: boolean;
}

export interface OnSyncEnvCompleted {
	__onSyncEnvCompleted: (env: string, baseUrl: string, requiredHeaders: TypedMap<string>) => void;
}

const dispatch_OnSyncEnvCompleted = new Dispatcher<OnSyncEnvCompleted, '__onSyncEnvCompleted'>(
	'__onSyncEnvCompleted');

class ModuleBE_v2_SyncEnv_Class
	extends Module<Config> {

	constructor() {
		super();
		this.setDefaultConfig({maxBatch: 500});
	}

	init() {
		super.init();
		addRoutes([
			createBodyServerApi(ApiDef_SyncEnvV2.vv1.syncToEnv, this.pushToEnv),
			createBodyServerApi(ApiDef_SyncEnvV2.vv1.syncFromEnvBackup, this.syncFromEnvBackup),
			createQueryServerApi(ApiDef_SyncEnvV2.vv1.createBackup, this.createBackup),
			createQueryServerApi(ApiDef_SyncEnvV2.vv1.fetchBackupMetadata, this.fetchBackupMetadata),
			createQueryServerApi(ApiDef_SyncEnvV2.vv1.syncFirebaseFromBackup, this.syncFirebaseFromBackup),
		]);
	}

	fetchBackupMetadata = async (queryParams: Request_GetMetadata): Promise<Response_FetchBackupMetadata> => {
		const backupInfo = await this.getBackupInfo(queryParams);

		if (!backupInfo)
			throw new ApiException(404, 'backup file not found');

		if (!backupInfo.metadata)
			throw new ApiException(404, 'No metadata found on this backup');

		return {
			...backupInfo.metadata,
			remoteCollectionNames: (RuntimeModules().filter<ModuleBE_BaseDBV3<any>>((module: DBModuleType) => !!module.dbDef?.dbKey)).map(_module => _module.dbDef.dbKey)
		};
	};

	async pushToEnv(body: {
		env: 'dev' | 'prod',
		moduleName: string,
		items: any[]
	}) {
		const remoteUrls = {
			dev: 'https://us-central1-shopify-manager-tool-dev.cloudfunctions.net/api',
			prod: 'https://mng.be.petitfawn.com'
		};

		const url = remoteUrls[body.env];
		const sessionId = MemKey_HttpRequest.get().headers['x-session-id'];

		const module = RuntimeModules().find<ModuleBE_BaseApiV3_Class<any>>((module: ApiModule) => module.dbModule?.dbDef?.dbKey === body.moduleName);

		const upsertAll = module.apiDef.v1.upsertAll;
		const response: Response_BackupDocs = await AxiosHttpModule
			.createRequest({...upsertAll, fullUrl: url + '/' + upsertAll.path, timeout: 5 * Minute})
			.setBody(body.items)
			.setUrlParams(body.items)
			.addHeader('x-session-id', sessionId!)
			.executeSync(true);

		console.log(response);
	}

	private async getBackupInfo(queryParams: Request_GetMetadata) {
		const {backupId, env} = queryParams;
		if (!env)
			throw new BadImplementationException(`Did not receive env in the fetch from env api call!`);

		const url: string = `${this.config.urlMap[env]}/v1/fetch-backup-docs-v2`;
		const outputDef: ApiDef<QueryApi<Response_BackupDocs, Request_BackupId>> = {method: HttpMethod.GET, path: '', fullUrl: url};
		const requestBody = {backupId};

		try {
			let request = AxiosHttpModule
				.createRequest(outputDef)
				.setUrlParams(requestBody);

			const sessionMap = this.config.sessionMap;
			if (sessionMap)
				request = request.addHeaders(sessionMap[env]);
			else
				request = request
					.addHeader('x-secret', this.config.fetchBackupDocsSecretsMap[env])
					.addHeader('x-proxy', 'fetch-env');

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

	createBackup = async () => {
		return ModuleBE_BackupDocDB.initiateBackup(true);
	};

	syncFromEnvBackup = async (body: Request_FetchFromEnvV2) => {
		if (Storm.getInstance().getEnvironment().toLowerCase() === 'prod' && body.env.toLowerCase() !== 'prod') {
			throw new MUSTNeverHappenException('wtf you doin');
		}
		this.logInfoBold('Received API call Fetch From Env!');
		this.logInfo(`Origin env: ${body.env}, bucketId: ${body.backupId}`);
		let startBackup = undefined; // required for log
		let endBackup = undefined; // required for log

		if (this.config.shouldBackupBeforeSync) {
			this.logInfo(`----  Creating Backup... ----`);
			startBackup = performance.now(); // required for log
			await this.createBackup();
			endBackup = performance.now(); // required for log
			this.logInfo(`Backup took ${((endBackup - startBackup) / 1000).toFixed(3)} seconds`);
		}

		this.logInfo(`----  Fetching Backup Info... ----`);
		const startSync = performance.now(); // required for log
		const backupInfo = await this.getBackupInfo(body);
		this.logInfo(backupInfo);

		if (!backupInfo.backupFilePath)
			throw new ApiException(404, 'Backup file path not found');

		this.logInfo(`----  Fetching Backup Stream from: ${backupInfo.firestoreSignedUrl} ----`);
		const signedUrlDef: ApiDef<QueryApi<any>> = {
			method: HttpMethod.GET,
			path: '',
			fullUrl: backupInfo.firestoreSignedUrl
		};

		const stream: Readable = await AxiosHttpModule
			.createRequest(signedUrlDef)
			.setResponseType('stream')
			.executeSync();

		this.logInfo(`----  Syncing Firestore... ----`);
		const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
		const firestore = firebaseSessionAdmin.getFirestoreV2().firestore;
		const readBatchSize = body.chunkSize ?? this.config.maxBatch * 4;

		let writeBatch = firestore.batch();
		let totalItems = 0;
		let batchItemsCounter = 0;
		let totalItemsCollected = 0;

		await CSVModule.forEachCsvRowFromStreamSync(stream, (row: any, index: number, transform) => {
			totalItems++;

			_keys(row).map(key => {
				row[(key as string).trim()] = (row[key] as string).trim();
			});

			if (!body.selectedModules.includes(row.collectionName))
				return;

			const documentRef = firestore.doc(`${row.collectionName}/${row._id}`);
			const data = JSON.parse(row.document);

			writeBatch.set(documentRef, data);
			batchItemsCounter++;
			if (batchItemsCounter < readBatchSize)
				return;

			this.logInfo(`calling pause`);
			transform.pause();

			const prevLimitCounter = batchItemsCounter;
			const prevBatch = writeBatch;
			batchItemsCounter = 0;
			writeBatch = firestore.batch();
			this.logInfo(`new batch created`);

			this.logInfo(`calling paused - committing`);
			prevBatch.commit().then(() => {
				this.logInfo(`committed ${prevLimitCounter} items`);
				totalItemsCollected += prevLimitCounter;

				transform.resume();
			}).catch(err => this.logError('error committing batch', err));

		});

		if (batchItemsCounter > 0) {
			await writeBatch.commit();
			totalItemsCollected += batchItemsCounter;
		}
		this.logInfo(`---- DONE Syncing Firestore: (${totalItemsCollected}/${totalItems})----`);

		this.logInfo(`----  Syncing Other Modules... ----`);
		await dispatch_OnSyncEnvCompleted.dispatchModuleAsync(body.env, this.config.urlMap[body.env], this.config.sessionMap[body.env]!);
		this.logInfo(`---- DONE Syncing Other Modules----`);
		const endSync = performance.now(); // required for log
		if (this.config.shouldBackupBeforeSync && endBackup !== undefined && startBackup !== undefined)
			this.logInfo(`(Backup took ${((endBackup - startBackup) / 1000).toFixed(3)} seconds)`);
		this.logInfo(`SyncingEnv took ${((endSync - startSync) / 1000).toFixed(3)} seconds`);
	};

	syncFirebaseFromBackup = async (queryParams: Request_FetchFirebaseBackup) => {
		try {
			this.logDebug('Getting the firebase backup file');
			const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
			const backupInfo = await this.getBackupInfo(queryParams);
			const database = firebaseSessionAdmin.getDatabase();

			this.logDebug('Reading the file from storage');
			const signedUrlDef: ApiDef<QueryApi<any>> = {
				method: HttpMethod.GET,
				path: '',
				fullUrl: backupInfo.firebaseSignedUrl
			};
			const firebaseFile = await AxiosHttpModule
				.createRequest(signedUrlDef)
				.executeSync();

			this.logDebug('Setting the file in firebase database');
			await database.set('/', firebaseFile);
		} catch (err: any) {
			throw new ApiException(500, err);
		}
	};
}

export const ModuleBE_v2_SyncEnv = new ModuleBE_v2_SyncEnv_Class();