import {_keys, ApiException, BadImplementationException, Minute, Module, TypedMap, UniqueId} from '@nu-art/ts-common';
import {CSVModule} from '@nu-art/ts-common/modules/CSVModule';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {addRoutes} from '../ModuleBE_APIs';
import {createBodyServerApi, createQueryServerApi} from '../../core/typed-api';
import {
	ApiDef,
	ApiDef_SyncEnvV2,
	HttpMethod,
	QueryApi,
	Request_BackupId,
	Request_FetchFirebaseBackup,
	Request_FetchFromEnvV2,
	Request_GetMetadata,
	Response_BackupDocsV2
} from '../../../shared';
import {AxiosHttpModule} from '../http/AxiosHttpModule';
import {ModuleBE_v2_Backup} from '../backup/ModuleBE_v2_Backup';
import {MemKey_HttpRequest} from '../server/consts';
import {Storm} from '../../core/Storm';
import {ModuleBE_BaseApiV3_Class} from '../db-api-gen/ModuleBE_BaseApiV3';


type Config = {
	urlMap: TypedMap<string>
	fetchBackupDocsSecretsMap: TypedMap<string>,
	sessionMap: TypedMap<TypedMap<string>>,
	maxBatch: number
}

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
			createBodyServerApi(ApiDef_SyncEnvV2.vv1.fetchFromEnv, this.fetchFromEnv),
			createQueryServerApi(ApiDef_SyncEnvV2.vv1.createBackup, this.createBackup),
			createQueryServerApi(ApiDef_SyncEnvV2.vv1.fetchBackupMetadata, this.fetchBackupMetadata),
			createQueryServerApi(ApiDef_SyncEnvV2.vv1.fetchFirebaseBackup, this.fetchFirebaseBackup),
		]);
	}

	fetchBackupMetadata = async (queryParams: Request_GetMetadata) => {
		const backupInfo = await this.getBackupInfo(queryParams);

		if (!backupInfo)
			throw new ApiException(404, 'backup file not found');

		if (!backupInfo.metadata)
			throw new ApiException(404, 'No metadata found on this backup');

		return backupInfo.metadata;
	};

	async pushToEnv(body: { env: 'dev' | 'prod', moduleName: string, items: any[] }) {
		const remoteUrls = {
			dev: 'https://us-central1-shopify-manager-tool-dev.cloudfunctions.net/api',
			prod: 'https://mng.be.petitfawn.com'
		};

		const url = remoteUrls[body.env];
		const sessionId = MemKey_HttpRequest.get().headers['x-session-id'];
		const module = Storm.getInstance()
			.filterModules(module => (module as ModuleBE_BaseApiV3_Class<any>).dbModule?.dbDef?.dbName === body.moduleName)[0] as ModuleBE_BaseApiV3_Class<any>;

		const upsertAll = module.apiDef.v1.upsertAll;
		const response: Response_BackupDocsV2 = await AxiosHttpModule
			.createRequest({...upsertAll, fullUrl: url + '/' + upsertAll.path, timeout: 5 * Minute})
			.setBody(body.items)
			.setUrlParams(body.items)
			.addHeader('x-session-id', sessionId!)
			.executeSync(true);

		console.log(response);
	}

	private async getBackupInfo(queryParams: { env: string, backupId: UniqueId }) {
		const {backupId, env} = queryParams;
		if (!env)
			throw new BadImplementationException(`Did not receive env in the fetch from env api call!`);

		const url: string = `${this.config.urlMap[env]}/v1/fetch-backup-docs-v2`;
		const outputDef: ApiDef<QueryApi<Response_BackupDocsV2, Request_BackupId>> = {method: HttpMethod.GET, path: '', fullUrl: url};
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

			const response: Response_BackupDocsV2 = await request.executeSync();
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
		return ModuleBE_v2_Backup.initiateBackup(true);
	};

	fetchFromEnv = async (body: Request_FetchFromEnvV2) => {
		this.logInfoBold('Received API call Fetch From Env!');
		this.logInfo(`Origin env: ${body.env}, bucketId: ${body.backupId}`);

		const backupInfo = await this.getBackupInfo(body);

		this.logInfo(backupInfo);

		if (!backupInfo.backupFilePath)
			throw new ApiException(404, 'Backup file path not found');

		const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();

		const firestore = firebaseSessionAdmin.getFirestoreV2().firestore;

		let resultsArray: { ref: FirebaseFirestore.DocumentReference, data: any }[] = [];
		const readBatchSize = this.config.maxBatch * 4;
		let totalReadCount = 0;

		const dataCallback = (row: any, index: number) => {
			if (index < totalReadCount || resultsArray.length === readBatchSize)
				return;

			_keys(row).map(key => {
				row[(key as string).trim()] = (row[key] as string).trim();
			});

			if (!body.selectedModules.includes(row.collectionName))
				return;

			const documentRef = firestore.doc(`${row.collectionName}/${row._id}`);
			const data = JSON.parse(row.document);

			resultsArray.push({ref: documentRef, data: data});
		};

		do {
			resultsArray = [];

			const signedUrlDef: ApiDef<QueryApi<any>> = {
				method: HttpMethod.GET,
				path: '',
				fullUrl: backupInfo.firestoreSignedUrl
			};
			const stream = await AxiosHttpModule
				.createRequest(signedUrlDef)
				.setResponseType('stream')
				.executeSync();

			await CSVModule.forEachCsvRowFromStreamSync(stream, dataCallback);

			for (let i = 0; i < resultsArray.length; i += this.config.maxBatch) {
				const writeBatch = firestore.batch();
				const batch = resultsArray.slice(i, i + this.config.maxBatch);

				batch.map(item => writeBatch.set(item.ref, item.data));

				await writeBatch.commit();
			}

			totalReadCount += resultsArray.length;
			this.logInfo(`results Array: ${resultsArray.length}`);
			this.logInfo(`readBatchSize: ${readBatchSize}`);
			this.logInfo(`totalReadCount: ${totalReadCount}`);
		} while (resultsArray.length > 0 && resultsArray.length % readBatchSize === 0);
	};

	fetchFirebaseBackup = async (queryParams: Request_FetchFirebaseBackup) => {
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