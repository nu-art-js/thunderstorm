import {filterInstances, Module, NotImplementedYetException, TypedMap} from '@nu-art/ts-common';
import {ModuleBE_Firebase, StorageWrapperBE} from '@nu-art/firebase-backend';
import {ApiDef_Assets, DB_Asset} from '@nu-art/file-upload-shared';
import {ModuleBE_AssetsDB} from './ModuleBE_AssetsDB.js';

/** Local interface (replaces thunderstorm-backend). */
export interface OnSyncEnvCompleted {
	__onSyncEnvCompleted(env: string, baseUrl: string, requiredHeaders: TypedMap<string>): Promise<void>;
}

type Config = {
	batchItemCount: number
}

export class ModuleBE_AssetsStorage_Class
	extends Module<Config>
	implements OnSyncEnvCompleted {

	readonly storage!: StorageWrapperBE;

	constructor() {
		super();
		this.setDefaultConfig({batchItemCount: 10});
	}

	init() {
		super.init();
		// @ts-ignore
		this.storage = ModuleBE_Firebase.createAdminSession().getStorage();
	}

	async __onSyncEnvCompleted(env: string, baseUrl: string, requiredHeaders: TypedMap<string>) {
		this.logWarning('Not Implemented Yet', new NotImplementedYetException('Sync assets not implemented'));

		let assetsToSync: DB_Asset[] = [];
		let page = 0;
		const itemsCount = this.config.batchItemCount;
		let dbAssets: DB_Asset[];
		do {
			dbAssets = await ModuleBE_AssetsDB.query.custom({limit: {page: page++, itemsCount}});
			if (dbAssets.length === 0)
				break;

			assetsToSync = filterInstances(await Promise.all(dbAssets.map(async dbAsset => {
				const fileWrapper = await this.getFile(dbAsset);
				if (await fileWrapper.exists())
					return undefined;

				return dbAsset;
			})));

			if (assetsToSync.length > 0)
				continue;

			for (const dbAsset of assetsToSync) {
				const base = baseUrl.replace(/\/$/, '');
				const path = ApiDef_Assets.getReadSignedUrl.path;
				let _signedUrl: string;
				try {
					const res = await fetch(`${base}/${path}`, {
						method: 'POST',
						headers: {...requiredHeaders, 'Content-Type': 'application/json'},
						body: JSON.stringify({_id: dbAsset._id})
					});
					const data = await res.json();
					_signedUrl = data.signedUrl;
				} catch (e) {
					console.log(e);
					continue;
				}

				const fileRes = await fetch(_signedUrl);
				const fileContent = await fileRes.text();
				await (await this.getFile(dbAsset)).write(fileContent);
			}
		} while (dbAssets.length > 0);
	}

	getReadSignedUrl = async (dbAsset: DB_Asset) => (await (await this.getFile(dbAsset)).getReadSignedUrl()).signedUrl;
	getFile = async (dbAsset: DB_Asset) => this.storage.getFile(dbAsset.path, dbAsset.bucketName);
}

export const ModuleBE_AssetsStorage = new ModuleBE_AssetsStorage_Class();
