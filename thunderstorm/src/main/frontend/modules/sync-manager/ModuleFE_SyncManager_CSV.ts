import {_keys, arrayToMap, mergeObject, Module, RuntimeModules, TypedMap} from '@nu-art/ts-common';
import {Readable, Writable} from 'stream';
import {DataStatus} from '../../core/db-api-gen/consts';
import {ModuleFE_BaseDB} from '../db-api-gen/ModuleFE_BaseDB';
import {Parser, ParseResult, ParseStepResult} from 'papaparse';
import {ModuleFE_CSVParser, PapaparseConfig} from '../ModuleFE_CSVParser';
import {ModuleSyncType} from '../db-api-gen/types';
import {Thunder} from '../../core/Thunder';
import firebase from 'firebase/compat';
import Error = firebase.auth.Error;
import { HeaderKey_ContentType } from '../../shared';


export class ModuleFE_SyncManager_CSV_Class
	extends Module {

	constructor() {
		super();
	}

	private getModulesToSync = () => RuntimeModules().filter<ModuleFE_BaseDB<any>>((module) => module.syncType === ModuleSyncType.CSVSync);

	syncFromCSVUrl = async (url: string, config?: PapaparseConfig) => {
		const modules = arrayToMap(this.getModulesToSync(), i => i.dbDef.dbKey);
		const start = performance.now();
		const itemsToSync: any[] = [];
		const errors: any[] = [];

		await new Promise<void>(resolve => {
			const isEmulator = Thunder.getInstance().getConfig().label?.toLowerCase() === 'local';
			const downloadRequestHeaders = isEmulator ? undefined : {[HeaderKey_ContentType]: 'text/csv'};
			const finalConfig = config ? mergeObject({downloadRequestHeaders}, config) : {downloadRequestHeaders};
			ModuleFE_CSVParser.fromURL(
				url,
				{
					transform: (value: string, field: string | number) => field === 'document' ? JSON.parse(value) : value,
					step: async (results: ParseStepResult<any>, parser: Parser) => {
						if (results.errors?.length)
							return errors.push(...results.errors);

						const item = results.data;
						const module = modules[item.dbKey];
						if (!module)
							return;

						itemsToSync.push(item);
					},
					complete: async (results: ParseResult<any>) => {
						for (const moduleKey of _keys(modules)) {
							const items = itemsToSync.filter(item => item.dbKey === moduleKey);
							const module = modules[moduleKey];
							this.logInfo(`Syncing ${items.length} items to ${moduleKey}`);
							await module.IDB.syncIndexDb(items.map(item => item.document));
							await module.cache.load();
							module.setDataStatus(DataStatus.ContainsData);
						}
						const end = performance.now();
						this.logInfo(`sync took ${((end - start) / 1000).toFixed(3)} seconds`);
						if (errors.length)
							this.logError('Parsed with errors', ...errors);
						resolve();
					},
					...finalConfig,
					error: (error: Error) => {
						this.logError(`CSV Parsing failed`, error);
					}
				});
		});
	};

	readyAllModules = async () => {
		const modules = this.getModulesToSync();
		this.logDebug('Readying modules', modules);
		for (const module of modules) {
			await module.cache.load();
			module.setDataStatus(DataStatus.ContainsData);
		}
	};

	syncFromBackupStream = async (stream: Readable) => {
		const modules = this.getModulesToSync();
		this.logInfo('Modules', modules);
		const writer = new ModuleIDBWriter(modules);
		await new Promise<void>((resolve, reject) => {
			stream.pipe(writer)
				.on('error', err => reject(err))
				.on('close', () => {
					modules.forEach(module => {
						module.setDataStatus(DataStatus.ContainsData);
					});
					resolve();
				});
		});
	};
}

export const ModuleFE_SyncManager_CSV = new ModuleFE_SyncManager_CSV_Class();

class ModuleIDBWriter
	extends Writable {

	readonly modules: ModuleFE_BaseDB<any>[];
	readonly moduleNameMap: TypedMap<ModuleFE_BaseDB<any>>;
	readonly paginationSize: number;
	private itemsToUpsert: any[] = [];

	constructor(modules: ModuleFE_BaseDB<any>[], paginationSize: number = 1000) {
		super();
		this.modules = modules;
		this.paginationSize = paginationSize;
		this.moduleNameMap = modules.reduce((acc, curr) => {
			acc[curr.dbDef.backend.name as string] = curr;
			return acc;
		}, {} as TypedMap<ModuleFE_BaseDB<any>>);
	}

	async _write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
		console.log('WRITE');
		this.itemsToUpsert.push(chunk);
		await this.upsertItems();
		callback();
	}

	async _final(callback: (error?: (Error | null)) => void) {
		await this.upsertItems(true);
		callback();
	}

	private upsertItems = async (force: boolean = false) => {
		const itemCount = this.itemsToUpsert.length;
		if ((itemCount < this.paginationSize) && !force)
			return;

		for (const item of this.itemsToUpsert) {
			const module = this.moduleNameMap[item.dbKey];
			if (!module)
				continue;

			const document = JSON.parse(item.document);
			await module.IDB.storeWrapper.upsert(document);
		}

		this.itemsToUpsert = [];
	};
}