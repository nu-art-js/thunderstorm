/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {AxiosHttpModule, OnSyncEnvCompleted} from '@nu-art/thunderstorm/backend';
import {filterInstances, Module, NotImplementedYetException, TypedMap} from '@nu-art/ts-common';
import {ModuleBE_Firebase, StorageWrapperBE} from '@nu-art/firebase/backend';
import {ApiDef_Assets, DB_Asset} from '../../shared';
import {HttpMethod} from '@nu-art/thunderstorm';
import {ModuleBE_AssetsDB} from './ModuleBE_AssetsDB';


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

		let assetsToSync = [];
		let page = 0;
		const itemsCount = this.config.batchItemCount;
		let dbAssets;
		do {
			dbAssets = await ModuleBE_AssetsDB.query.custom({limit: {page: page++, itemsCount}});
			if (dbAssets.length === 0)
				break;

			assetsToSync = filterInstances(await Promise.all(dbAssets.map(async dbAsset => {
				const fileWrapper = await this.getFile(dbAsset);
				if (await fileWrapper.exists())
					return;

				return dbAsset;
			})));

			if (assetsToSync.length > 0)
				continue;

			assetsToSync.map(async dbAsset => {

				let _signedUrl;
				try {
					const {signedUrl} = await AxiosHttpModule
						.createRequest({...ApiDef_Assets.vv1.getReadSignedUrl, baseUrl,})
						.setHeaders(requiredHeaders)
						.setBodyAsJson({assetId: dbAsset._id})
						.executeSync();
					_signedUrl = signedUrl;
				} catch (e) {
					console.log(e);
				}

				const fileContent = await AxiosHttpModule.createRequest({method: HttpMethod.GET, fullUrl: _signedUrl, path: ''})
					.setResponseType('text')
					.executeSync();

				await (await this.getFile(dbAsset)).write(fileContent);
			});
		} while (dbAssets.length > 0);

	}

	getReadSignedUrl = async (dbAsset: DB_Asset) => (await (await this.getFile(dbAsset)).getReadSignedUrl()).signedUrl;
	getFile = async (dbAsset: DB_Asset) => this.storage.getFile(dbAsset.path, dbAsset.bucketName);
}

export const ModuleBE_AssetsStorage = new ModuleBE_AssetsStorage_Class();




