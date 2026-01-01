import {_keys, filterInstances, LogLevel, merge, Module, Promise_all_sequentially, RuntimeModules} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '../db-api-gen/ModuleBE_BaseDB.js';
import {dispatch_CollectEntityDependencies} from './dispatcher.js';
import {addRoutes, createBodyServerApi} from '@nu-art/express-server';
import {ApiDef_CollectionActions, CollectionActions_Check, CollectionActions_Upgrade} from '@nu-art/thunder-action-processor-shared';

class ModuleBE_CollectionActions_Class
	extends Module {

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);
	}

	protected init() {
		super.init();
		addRoutes([
			//Add upgrade routes
			createBodyServerApi(ApiDef_CollectionActions.upgrade.collections, this.upgrade_Collections),
			createBodyServerApi(ApiDef_CollectionActions.upgrade.all, this.upgrade_All),
			//Add check routes
			createBodyServerApi(ApiDef_CollectionActions.check.usage, this.check_Usage),
		]);
	}

	// ##################### Internal Logic #####################

	private getUpgradableModules = async (limitKeys: string[], forceUpgrade?: boolean): Promise<ModuleBE_BaseDB<any>[]> => {
		const filterModule = async (_module: Module) => {
			const module = _module as ModuleBE_BaseDB<any>;
			const dbKey = module?.dbDef?.dbKey;
			//Assert dbKey exists
			if (!dbKey)
				return undefined;

			//Assert not an advisor collection module
			if ((module as ModuleBE_BaseDB<any> & { advisorCollectionModule: boolean }).advisorCollectionModule)
				return undefined;

			//Assert in the user given keys
			if (limitKeys.length > 0 && !limitKeys.includes(dbKey))
				return undefined;

			const isUpToDate = await module.isCollectionUpToDate();
			return (!isUpToDate || forceUpgrade) ? module : undefined;
		};
		const allModules = RuntimeModules().all;
		return filterInstances(await Promise.all(allModules.map(filterModule)));
	};

	// ##################### API Callbacks - Upgrade #####################

	public upgrade_Collections = async (req: CollectionActions_Upgrade['collections']['request']): Promise<CollectionActions_Upgrade['collections']['response']> => {
		this.logInfo(`Upgrade - Collections${req.force ? ', Forcefully' : ''}`);
		if (req.dbKeys.length)
			this.logInfo(`Limited to ${req.dbKeys.length} collections:`, req.dbKeys.join(', '));
		else
			this.logInfo('No collection limit');

		const modules = await this.getUpgradableModules(req.dbKeys, req.force);
		this.logInfo(`Will upgrade ${modules.length} modules`);
		await Promise_all_sequentially(modules.map(module => () => module.upgradeCollection(req.force)));
	};

	public upgrade_All = async (req: CollectionActions_Upgrade['all']['request']): Promise<CollectionActions_Upgrade['all']['response']> => {
		this.logInfo('Upgrade - All');
		//Call upgrade collections with no dbKey limit
		await this.upgrade_Collections({dbKeys: [], force: req.force});
	};

	// ##################### API Callbacks - Check #####################

	public check_Usage = async (req: CollectionActions_Check['usage']['request']): Promise<CollectionActions_Check['usage']['response']> => {
		this.logInfo(`Checking usage for ${req.itemIds.length} items under the "${req.dbKey}" collection`);
		const dependencies = await dispatch_CollectEntityDependencies.dispatchModuleAsync(req.dbKey, req.itemIds);
		const filtered = filterInstances(dependencies);
		if (!filtered.length)
			return {dependencies: undefined};
		const merged = filtered.reduce((acc, dependency) => merge(acc, dependency));
		const dependenciesAmount = _keys(merged.dependencyMap).length;
		return {dependencies: dependenciesAmount ? merged : undefined};
	};
}

export const ModuleBE_CollectionActions = new ModuleBE_CollectionActions_Class();