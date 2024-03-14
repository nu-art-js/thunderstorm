import {ApiException, BadImplementationException, Dispatcher, Minute, Module, MUSTNeverHappenException, RuntimeModules, TypedMap} from '@nu-art/ts-common';
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
	Request_FetchFirebaseBackup,
	Request_FetchFromEnvV2,
	Request_GetMetadata,
	Response_BackupDocs,
	Response_FetchBackupMetadata
} from '../../../shared';
import {AxiosHttpModule} from '../http/AxiosHttpModule';
import {MemKey_HttpRequest} from '../server/consts';
import {ModuleBE_BaseApiV3_Class} from '../db-api-gen/ModuleBE_BaseApiV3';
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
			remoteCollectionNames: (RuntimeModules()
				.filter<ModuleBE_BaseDBV3<any>>((module: DBModuleType) => !!module.dbDef?.dbKey)).map(_module => _module.dbDef.dbKey)
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

	createBackup = async () => {
		return ModuleBE_BackupDocDB.initiateBackup(true);
	};

	// restoreFirestoreFromBackup = async (body: Request_FetchFromEnvV2) => {
	syncFromEnvBackup = async (body: Request_FetchFromEnvV2) => {
		if (Storm.getInstance().getEnvironment().toLowerCase() === 'prod' && body.env.toLowerCase() !== 'prod') {
			throw new MUSTNeverHappenException('MUST NEVER SYNC ENV THAT IS NOT PROD TO PROD!!');
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

		const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
		const firestore = firebaseSessionAdmin.getFirestoreV2().firestore;
		let writeBatch = firestore.batch();
		const backupInfo = await this.getBackupInfo(body);

		await ModuleBE_BackupDocDB.iterateOnBackup({
			stream: await ModuleBE_BackupDocDB.getBackupStreamFromId(backupInfo),
			chunkSize: body.chunkSize,
			filter: (collectionName: string) => {
				return body.selectedModules.includes(collectionName);
			},
			process: (row) => {
				const documentRef = firestore.doc(`${row.collectionName}/${row._id}`);
				const data = JSON.parse(row.document);

				writeBatch.set(documentRef, data);
			},
			paginate: () => {
				const prevBatch = writeBatch;
				writeBatch = firestore.batch();
				this.logInfo(`committing`);
				return prevBatch.commit();
			},
		});

		this.logInfo(`----  Syncing Other Modules... ----`);
		await dispatch_OnSyncEnvCompleted.dispatchModuleAsync(body.env, this.config.urlMap[body.env], this.config.sessionMap[body.env]!);
		this.logInfo(`---- DONE Syncing Other Modules----`);

		if (this.config.shouldBackupBeforeSync && endBackup !== undefined && startBackup !== undefined)
			this.logInfo(`(Backup took ${((endBackup - startBackup) / 1000).toFixed(3)} seconds)`);
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

export const ModuleBE_v2_SyncEnv = new ModuleBE_v2_SyncEnv_Class();