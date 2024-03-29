import {_keys, arrayToMap, Module, RuntimeModules, TypedMap} from '@nu-art/ts-common';
import {Readable, Writable} from 'stream';
import {DataStatus} from '../../core/db-api-gen/consts';
import {ModuleFE_v3_BaseDB} from '../db-api-gen/ModuleFE_v3_BaseDB';
import {Parser, ParseResult, ParseStepResult} from 'papaparse';
import {ModuleFE_CSVParser} from '../ModuleFE_CSVParser';
import {ModuleSyncType} from '../db-api-gen/types';

export class ModuleFE_SyncManager_CSV_Class
	extends Module {

	constructor() {
		super();
	}

	private getModulesToSync = () => RuntimeModules().filter<ModuleFE_v3_BaseDB<any>>((module) => module.syncType === ModuleSyncType.CSVSync);

	syncFromCSVUrl = async (url: string) => {
		const modules = arrayToMap(this.getModulesToSync(), i => i.dbDef.backend.name);
		const start = performance.now();
		const itemsToSync: any[] = [];
		const errors: any[] = [];

		await new Promise<void>(resolve => {
			ModuleFE_CSVParser.fromURL(url, {
				transform: (value: string, field: string | number) => field === 'document' ? JSON.parse(value) : value,
				step: async (results: ParseStepResult<any>, parser: Parser) => {
					if (results.errors?.length)
						return errors.push(...results.errors);

					const item = results.data;
					const module = modules[item.collectionName];
					if (!module)
						return;

					itemsToSync.push(item);
				},
				complete: async (results: ParseResult<any>) => {
					for (const moduleKey of _keys(modules)) {
						const items = itemsToSync.filter(item => item.collectionName === moduleKey);
						const module = modules[moduleKey];
						this.logInfo(`Syncing ${items.length} items to ${moduleKey}`);
						await module.IDB.syncIndexDb(items);
					}
					const end = performance.now();
					this.logInfo(`sync took ${((end - start) / 1000).toFixed(3)} seconds`);
					if (errors.length)
						this.logError('Parsed with errors', ...errors);
					resolve();
				}
			});
		});
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

	// private syncModules = async (data: any[]) => {
	// 	const modules = arrayToMap(this.getModulesToSync(), i => i.dbDef.backend.name);
	// 	for (const item of data) {
	// 		const module = modules[item.collectionName];
	// 		if (!module)
	// 			continue;
	// 		await module.IDB.storeWrapper.upsert(item.document);
	// 	}
	// };
}

export const ModuleFE_SyncManager_CSV = new ModuleFE_SyncManager_CSV_Class();

class ModuleIDBWriter extends Writable {

	readonly modules: ModuleFE_v3_BaseDB<any>[];
	readonly moduleNameMap: TypedMap<ModuleFE_v3_BaseDB<any>>;
	readonly paginationSize: number;
	private itemsToUpsert: any[] = [];

	constructor(modules: ModuleFE_v3_BaseDB<any>[], paginationSize: number = 1000) {
		super();
		this.modules = modules;
		this.paginationSize = paginationSize;
		this.moduleNameMap = modules.reduce((acc, curr) => {
			acc[curr.dbDef.backend.name as string] = curr;
			return acc;
		}, {} as TypedMap<ModuleFE_v3_BaseDB<any>>);
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
			const module = this.moduleNameMap[item.collectionName];
			if (!module)
				continue;

			const document = JSON.parse(item.document);
			await module.IDB.storeWrapper.upsert(document);
		}

		this.itemsToUpsert = [];
	};
}