/*
 * @nu-art/db-api-backend - Collection-level actions (upgrade, dependency checks)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {_keys, filterInstances, LogLevel, merge, Module, Promise_all_sequentially, RuntimeModules} from '@nu-art/ts-common';
import {ApiHandler} from '@nu-art/http-server';
import {ApiDef_CollectionActions, CollectionActions_Check, CollectionActions_Upgrade} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from './ModuleBE_BaseDB.js';
import {dispatch_CollectEntityDependencies} from './storm-stubs.js';

class ModuleBE_CollectionActions_Class
	extends Module {

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);
	}

	private async getUpgradableModules(limitKeys: string[], forceUpgrade?: boolean): Promise<ModuleBE_BaseDB<any>[]> {
		const filterModule = async (_module: Module) => {
			const module = _module as ModuleBE_BaseDB<any>;
			const dbKey = module?.dbDef?.dbKey;
			if (!dbKey)
				return undefined;

			if ((module as ModuleBE_BaseDB<any> & { advisorCollectionModule: boolean }).advisorCollectionModule)
				return undefined;

			if (limitKeys.length > 0 && !limitKeys.includes(dbKey))
				return undefined;

			const isUpToDate = await module.isCollectionUpToDate();
			return (!isUpToDate || forceUpgrade) ? module : undefined;
		};
		const allModules = RuntimeModules().all;
		return filterInstances(await Promise.all(allModules.map(filterModule)));
	}

	@ApiHandler(ApiDef_CollectionActions.upgrade.collections)
	async upgradeCollections(req: CollectionActions_Upgrade['collections']['request']): Promise<CollectionActions_Upgrade['collections']['response']> {
		this.logInfo(`Upgrade - Collections${req.force ? ', Forcefully' : ''}`);
		if (req.dbKeys.length)
			this.logInfo(`Limited to ${req.dbKeys.length} collections:`, req.dbKeys.join(', '));
		else
			this.logInfo('No collection limit');

		const modules = await this.getUpgradableModules(req.dbKeys, req.force);
		this.logInfo(`Will upgrade ${modules.length} modules`);
		await Promise_all_sequentially(modules.map(module => () => module.upgradeCollection(req.force)));
	}

	@ApiHandler(ApiDef_CollectionActions.upgrade.all)
	async upgradeAll(req: CollectionActions_Upgrade['all']['request']): Promise<CollectionActions_Upgrade['all']['response']> {
		this.logInfo('Upgrade - All');
		await this.upgradeCollections({dbKeys: [], force: req.force});
	}

	@ApiHandler(ApiDef_CollectionActions.check.usage)
	async checkUsage(req: CollectionActions_Check['usage']['request']): Promise<CollectionActions_Check['usage']['response']> {
		this.logInfo(`Checking usage for ${req.itemIds.length} items under the "${req.dbKey}" collection`);
		const dependencies = await dispatch_CollectEntityDependencies.dispatchModuleAsync(req.dbKey, req.itemIds);
		const filtered = filterInstances(dependencies);
		if (!filtered.length)
			return {dependencies: undefined};

		const merged = filtered.reduce((acc, dependency) => merge(acc, dependency));
		const dependenciesAmount = _keys(merged.dependencyMap).length;
		return {dependencies: dependenciesAmount ? merged : undefined};
	}
}

export const ModuleBE_CollectionActions = new ModuleBE_CollectionActions_Class();
