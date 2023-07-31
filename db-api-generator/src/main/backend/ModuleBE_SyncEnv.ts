import {ApiDef, HttpMethod, QueryApi, Request_BackupId, Response_BackupDocs} from '@nu-art/thunderstorm';
import {addRoutes, AxiosHttpModule, createBodyServerApi, Storm} from '@nu-art/thunderstorm/backend';
import {BadImplementationException, DB_Object, Module, TypedMap} from '@nu-art/ts-common';
import {ApiDef_SyncEnv, Request_FetchFromEnv} from '../shared';
import {ModuleBE_BaseDB} from './ModuleBE_BaseDB';
import {ModuleBE_BaseDBV2} from './ModuleBE_BaseDBV2';


type Config = {
	urlMap: TypedMap<string>
	fetchBackupDocsSecretsMap: TypedMap<string>
}

class ModuleBE_SyncEnv_Class
	extends Module<Config> {

	constructor() {
		super();
	}

	init() {
		super.init();
		addRoutes([createBodyServerApi(ApiDef_SyncEnv.vv1.fetchFromEnv, this.fetchFromEnv)]);
	}

	fetchFromEnv = async (body: Request_FetchFromEnv) => {
		this.logInfoBold('Received API call Fetch From Env!');
		this.logInfo(`Origin env: ${body.env}, bucketId: ${body.backupId}`);

		if (!body.env)
			throw new BadImplementationException(`Did not receive env in the fetch from env api call!`);

		if (body.onlyModules && body.excludedModules)
			this.logWarningBold('excludedModules config exists alongside onlyModules, so excludedModules are ignored.');

		this.logInfo('\n\n\n\n\noyoyoyoyo');
		this.logInfo(this.config.urlMap);
		this.logInfo('\n\n\n\n\n');
		const url: string = `${this.config.urlMap[body.env]}/v1/fetch-backup-docs`;
		const outputDef: ApiDef<QueryApi<any>> = {method: HttpMethod.GET, path: '', fullUrl: url};

		const requestBody: Request_BackupId = {backupId: body.backupId};

		const response: Response_BackupDocs = await AxiosHttpModule
			.createRequest(outputDef)
			.setUrlParams(requestBody)
			.addHeader('x-secret', this.config.fetchBackupDocsSecretsMap[body.env])
			.addHeader('x-proxy', 'fetch-env')
			.executeSync();

		const wrongBackupIdDescriptor = response.backupDescriptors.find(descriptor => descriptor.backupId !== body.backupId);
		if (wrongBackupIdDescriptor)
			throw new BadImplementationException(`Received backup descriptors with wrong backupId! provided id: ${body.backupId} received id: ${wrongBackupIdDescriptor.backupId}`);

		this.logInfo(`Found ${response.backupDescriptors.length} Backup Descriptors.`);

		await Promise.all(response.backupDescriptors.map(async (backupDescriptor) => {
			const moduleKey = backupDescriptor.moduleKey;
			const hasOnlyModulesArray = body.onlyModules && !!body.onlyModules.length;
			if (hasOnlyModulesArray && !body.onlyModules?.includes(moduleKey)) {
				this.logWarning(`Module ${moduleKey} is skipped from syncing due to not being in the list of specified modules to sync.`);
				return;
			}

			if (!hasOnlyModulesArray && body.excludedModules?.includes(moduleKey)) {
				this.logWarning(`Module ${moduleKey} is skipped from syncing due to being in the excluded modules list.`);
				return;
			}

			const stormInstance = Storm.getInstance();
			const relevantModuleV1: ModuleBE_BaseDB<any>[] = stormInstance.filterModules((module) => {
				//the moduleKey in ModuleBE_BaseDB's config is taken from collection's name.
				return module instanceof ModuleBE_BaseDB && (module as ModuleBE_BaseDB<any>).getCollectionName() === moduleKey;
			});

			const relevantModuleV2: ModuleBE_BaseDBV2<any>[] = stormInstance.filterModules((module) => {
				//the moduleKey in ModuleBE_BaseDB's config is taken from collection's name.
				return module instanceof ModuleBE_BaseDBV2 && (module as ModuleBE_BaseDBV2<any>).getCollectionName() === moduleKey;
			});


			if (!relevantModuleV2.length && !relevantModuleV1.length) {
				this.logErrorBold(`Failed to find collection module for collectionName: ${backupDescriptor.moduleKey}!`);
				return;
			}

			const signedUrlDef: ApiDef<QueryApi<any>> = {
				method: HttpMethod.GET,
				path: '',
				fullUrl: backupDescriptor.signedUrl
			};
			const backupFile: DB_Object[] = await AxiosHttpModule
				.createRequest(signedUrlDef)
				.executeSync();

			this.logInfo(backupDescriptor.moduleKey);
			this.logInfo(`Received backup descriptor for '${backupDescriptor.moduleKey}', found module name: ${relevantModuleV1[0]?.getName() || relevantModuleV2[0]?.getName()}, ${relevantModuleV1[0]?.getCollectionName() || relevantModuleV2[0]?.getCollectionName()}`);

			if (relevantModuleV1.length) {
				await relevantModuleV1[0].upsertAll(backupFile);
			} else {
				await relevantModuleV2[0].set.all(backupFile);
			}
		}));
	};
}

export const ModuleBE_SyncEnv = new ModuleBE_SyncEnv_Class();