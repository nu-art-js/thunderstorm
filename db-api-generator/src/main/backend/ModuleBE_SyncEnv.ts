import {ApiDef, HttpMethod, QueryApi, Request_BackupId, Response_BackupDocs} from '@nu-art/thunderstorm';
import {addRoutes, AxiosHttpModule, createBodyServerApi, Storm} from '@nu-art/thunderstorm/backend';
import {DB_Object, Module, TypedMap, BadImplementationException} from '@nu-art/ts-common';
import {ApiDef_SyncEnv, Request_FetchFromEnv} from '../shared';
import {BaseDB_ModuleBE} from './BaseDB_ModuleBE';

type Config = {
	urlMap: TypedMap<string>
}

class ModuleBE_SyncEnv_Class
	extends Module<Config> {

	constructor() {
		super();
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

			const relevantModule: BaseDB_ModuleBE<any>[] = Storm.getInstance().filterModules((module) => {
				//the moduleKey in BaseDB_ModuleBE's config is taken from collection's name.
				return module instanceof BaseDB_ModuleBE && (module as BaseDB_ModuleBE<any>).getCollectionName() === moduleKey;
			});

			if (relevantModule.length === 0) {
				this.logErrorBold(`Failed to find collection module for collectionName: ${backupDescriptor.moduleKey}!`);
				return;
			}

			const signedUrlDef: ApiDef<QueryApi<any>> = {method: HttpMethod.GET, path: '', fullUrl: backupDescriptor.signedUrl};
			const backupFile: DB_Object[] = await AxiosHttpModule
				.createRequest(signedUrlDef)
				.executeSync();

			this.logInfo(backupDescriptor.moduleKey);
			this.logInfo(`Received backup descriptor for '${backupDescriptor.moduleKey}', found module name: ${relevantModule[0].getName()}, ${relevantModule[0].getCollectionName()}`);

			await relevantModule[0].upsertAll(backupFile);
		}));
	};
}

export const ModuleBE_SyncEnv = new ModuleBE_SyncEnv_Class();