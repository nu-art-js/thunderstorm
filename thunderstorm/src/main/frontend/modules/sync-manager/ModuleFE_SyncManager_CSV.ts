import {_keys, DB_Object, Module, RuntimeModules, TypedMap} from '@nu-art/ts-common';
import {Readable, Writable} from 'stream';
import {DataStatus} from '../../core/db-api-gen/consts';
import {ModuleFE_v3_BaseDB, ModuleSyncType} from '../db-api-gen/ModuleFE_v3_BaseDB';

export class ModuleFE_SyncManager_CSV_Class
	extends Module {

	constructor() {
		super();
	}

	private getModulesToSync = () => RuntimeModules().filter<ModuleFE_v3_BaseDB<any>>((module) => module.syncType === ModuleSyncType.CSVSync);

	syncFromBackupStream = async (stream: Readable) => {
		const modules = this.getModulesToSync();
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

class ModuleIDBWriter extends Writable {

	readonly modules: ModuleFE_v3_BaseDB<any>[];
	readonly moduleNameMap: TypedMap<ModuleFE_v3_BaseDB<any>>;
	readonly paginationSize: number;

	private itemsToUpsert: TypedMap<DB_Object[]> = {};
	private itemCount: number = 0;

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
		const collectionName = chunk.collectionName as string;
		const document = JSON.parse(chunk.document);
		if (!this.itemsToUpsert[collectionName])
			this.itemsToUpsert[collectionName] = [];

		this.itemsToUpsert[collectionName].push(document);
		this.itemCount++;
		await this.upsertItems();
		callback();
	}

	async _final(callback: (error?: (Error | null)) => void) {
		await this.upsertItems(true);
		callback();
	}

	private upsertItems = async (force: boolean = false) => {
		if (this.itemCount < this.paginationSize && !force)
			return;

		const collections = _keys(this.itemsToUpsert) as string[];
		for (const collection of collections) {
			const module = this.moduleNameMap[collection];
			if (!module)
				return;

			await module.IDB.syncIndexDb(this.itemsToUpsert[collection]);
		}

		this.itemsToUpsert = {};
		this.itemCount = 0;
	};

}