import {
	ApiException,
	arrayToMap,
	BadImplementationException,
	Dispatcher,
	Minute,
	Module,
	MUSTNeverHappenException,
	RuntimeModules,
	TypedMap
} from '@nu-art/ts-common';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {addRoutes} from '../ModuleBE_APIs';
import {createBodyServerApi, createQueryServerApi} from '../../core/typed-api';
import {
	ApiDef,
	ApiDef_SyncEnv,
	ApiModule,
	DBModuleType,
	HttpMethod,
	QueryApi,
	Request_FetchFirebaseBackup,
	Request_FetchFromEnv,
	Request_GetMetadata,
	Response_BackupDocs,
	Response_FetchBackupMetadata
} from '../../../shared';
import {AxiosHttpModule} from '../http/AxiosHttpModule';
import {MemKey_HttpRequest} from '../server/consts';
import {ModuleBE_BaseApi_Class} from '../db-api-gen/ModuleBE_BaseApi';
import {Storm} from '../../core/Storm';
import {ModuleBE_BackupDocDB} from '../../../_entity/backup-doc/backend';
import {ModuleBE_BaseDB} from '../db-api-gen/ModuleBE_BaseDB';
import {Transform, Writable} from 'stream';
import {firestore} from 'firebase-admin';


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

class ModuleBE_SyncEnv_Class
	extends Module<Config> {

	constructor() {
		super();
		this.setDefaultConfig({maxBatch: 500});
	}

	init() {
		super.init();
		addRoutes([
			createBodyServerApi(ApiDef_SyncEnv.vv1.syncToEnv, this.pushToEnv),
			createBodyServerApi(ApiDef_SyncEnv.vv1.syncFromEnvBackup, this.syncFromEnvBackup),
			createQueryServerApi(ApiDef_SyncEnv.vv1.createBackup, this.createBackup),
			createQueryServerApi(ApiDef_SyncEnv.vv1.fetchBackupMetadata, this.fetchBackupMetadata),
			createQueryServerApi(ApiDef_SyncEnv.vv1.syncFirebaseFromBackup, this.syncFirebaseFromBackup),
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
			remoteCollectionNames: (RuntimeModules()
				.filter<ModuleBE_BaseDB<any>>((module: DBModuleType) => !!module.dbDef?.dbKey)).map(_module => _module.dbDef.dbKey)
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

		const module = RuntimeModules().find<ModuleBE_BaseApi_Class<any>>((module: ApiModule) => module.dbModule?.dbDef?.dbKey === body.moduleName);

		const upsertAll = module.apiDef.v1.upsertAll;
		const response: Response_BackupDocs = await AxiosHttpModule
			.createRequest({...upsertAll, fullUrl: url + '/' + upsertAll.path, timeout: 5 * Minute})
			.setBody(body.items)
			.setUrlParams(body.items)
			.addHeader('x-session-id', sessionId!)
			.executeSync(true);

		console.log(response);
	}

	createBackup = async () => {
		return ModuleBE_BackupDocDB.initiateBackup(true);
	};

	syncFromEnvBackup = async (body: Request_FetchFromEnv) => {
		if (Storm.getInstance().getEnvironment().toLowerCase() === 'prod' && body.env.toLowerCase() !== 'prod') {
			throw new MUSTNeverHappenException('MUST NEVER SYNC ENV THAT IS NOT PROD TO PROD!!');
		}

		this.logInfoBold('Received API call Fetch From Env!');
		this.logInfo(`Origin env: ${body.env}, bucketId: ${body.backupId}`);
		let startTime = undefined; // required for log
		let endTime = undefined; // required for log

		if (this.config.shouldBackupBeforeSync) {
			this.logInfo(`----  Creating Backup... ----`);
			startTime = performance.now(); // required for log
			await this.createBackup();
			endTime = performance.now(); // required for log
			this.logInfo(`Backup took ${((endTime - startTime) / 1000).toFixed(3)} seconds`);
		}

		const backupInfo = await this.getBackupInfo(body);
		const stream = await ModuleBE_BackupDocDB.createBackupReadStream(backupInfo);
		const collectionFilter = new SyncCollectionFilter(body.selectedModules);
		const collectionWriter = new CollectionBatchWriter(body.chunkSize);

		this.logInfo(`----  Syncing Collections From Backup... ----`);
		startTime = performance.now();
		await new Promise<void>((resolve, reject) => {
			stream
				.pipe(collectionFilter)
				.pipe(collectionWriter)
				.on('finish', () => resolve())
				.on('error', err => reject(err));
		});
		endTime = performance.now();
		this.logInfo(`Syncing Collections took ${((endTime - startTime) / 1000).toFixed(3)} seconds`);

		this.logInfo(`----  Syncing Other Modules... ----`);
		await dispatch_OnSyncEnvCompleted.dispatchModuleAsync(body.env, this.config.urlMap[body.env], this.config.sessionMap[body.env]!);
		this.logInfo(`---- DONE Syncing Other Modules----`);

		if (this.config.shouldBackupBeforeSync && endTime !== undefined && startTime !== undefined)
			this.logInfo(`(Backup took ${((endTime - startTime) / 1000).toFixed(3)} seconds)`);
	};

	private async getBackupInfo(queryParams: Request_GetMetadata) {
		const {backupId, env} = queryParams;
		if (!env)
			throw new BadImplementationException(`Did not receive env in the fetch from env api call!`);

		return ModuleBE_BackupDocDB.getBackupInfo(backupId, this.config.urlMap[env], this.config.sessionMap[env]);
	}

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

export const ModuleBE_SyncEnv = new ModuleBE_SyncEnv_Class();

class SyncCollectionFilter
	extends Transform {

	readonly allowedDbKeys: string[];

	constructor(allowedDbKeys: string[]) {
		super({objectMode: true});
		this.allowedDbKeys = allowedDbKeys;
	}

	_transform(chunk: any, encoding: string, callback: Function) {
		if (this.allowedDbKeys.includes(chunk.dbKey)) {
			this.push(chunk);
		}
		callback();
	}
}

class CollectionBatchWriter
	extends Writable {

	private itemCount: number = 0;
	private paginationSize: number;
	private firestore: firestore.Firestore;
	private batchWriter: firestore.WriteBatch;
	private modules;

	constructor(paginationSize: number) {
		super({objectMode: true});
		this.paginationSize = paginationSize;
		const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
		this.firestore = firebaseSessionAdmin.getFirestoreV2().firestore;
		this.batchWriter = this.firestore.batch();
		this.modules = arrayToMap(RuntimeModules()
			.filter((module: DBModuleType) => !(!module || !module.dbDef)), module => module.dbDef!.dbKey);
	}

	async _write(chunk: any, encoding: string, callback: (error?: Error | null) => void) {
		try {
			const collectionName = this.modules[chunk.dbKey].dbDef!.dbKey;
			const docRef = this.firestore.doc(`${collectionName}/${chunk._id}`);
			const data = JSON.parse(chunk.document);
			this.batchWriter.set(docRef, data);
			this.itemCount++;

			if (this.itemCount === this.paginationSize) {
				const prevBatchWriter = this.batchWriter;
				this.batchWriter = this.firestore.batch();
				this.itemCount = 0;
				await prevBatchWriter.commit();
			}
			callback();
		} catch (error) {
			callback(error instanceof Error ? error : new Error(String(error)));
		}
	}

	async _final(callback: (error?: Error | null) => void) {
		try {
			await this.batchWriter.commit();
			callback();
		} catch (err: any) {
			callback(err as Error);
		}
	}
}