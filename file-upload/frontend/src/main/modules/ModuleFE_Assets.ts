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
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import type {DBConfig_ModuleFE, EventDispatcher} from '@nu-art/db-api-frontend';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {HttpClient} from '@nu-art/http-client';
import {currentTimeMillis} from '@nu-art/ts-common';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {ApiDef_Assets, DBDef_Assets, DatabaseDef_Assets} from '@nu-art/file-upload-shared';
import type {ApiCallerEventType} from '@nu-art/db-api-shared';

type AssetsApiVV1 = { getReadSignedUrl: (params: { _id: string }) => { executeSync(): Promise<{ signedUrl: string }> } };

export interface OnAssetsUpdated {
	__onAssetsUpdated: (...params: ApiCallerEventType<DatabaseDef_Assets['dbType']>) => void;
}

export const dispatch_onAssetsListChanged = new ThunderDispatcher<OnAssetsUpdated, '__onAssetsUpdated'>('__onAssetsUpdated');

const assetsConfig: DBConfig_ModuleFE<DatabaseDef_Assets> = {
	dbKey: DBDef_Assets.dbKey,
	validator: DBDef_Assets.modifiablePropsValidator,
	uniqueKeys: ['_id'],
	versions: [...DBDef_Assets.versions],
	dbConfig: {
		name: DBDef_Assets.frontend.name,
		group: DBDef_Assets.frontend.group,
		version: 'v1',
		uniqueKeys: ['_id'],
	},
};

const dispatcher: EventDispatcher<DatabaseDef_Assets['dbType']> = (...args: ApiCallerEventType<DatabaseDef_Assets['dbType']>) => dispatch_onAssetsListChanged.dispatchUI(...args);

export class ModuleFE_Assets_Class
	extends ModuleFE_BaseApi<DatabaseDef_Assets> {

	readonly vv1: AssetsApiVV1;

	constructor() {
		super({
			config: assetsConfig,
			crudApiDef: CrudApiDef<DatabaseDef_Assets>(DBDef_Assets.dbKey, 'v1'),
			dispatcher,
		});
		this.vv1 = {
			getReadSignedUrl: (params: { _id: string }) => {
				const req = HttpClient.default.createRequest(ApiDef_Assets.getReadSignedUrl).setBodyAsJson(params);
				return {
					executeSync: () => req.execute(),
				};
			},
		};
	}

	async resolveValidSignedUrl(assetId: string) {
		const id = assetId as DatabaseDef_Assets['dbType']['_id'];
		const asset = this.cache.unique(id);
		const signedUrl = (asset?.signedUrl?.validUntil || 0) > currentTimeMillis() ? asset?.signedUrl : undefined;
		if (signedUrl)
			return signedUrl.url;

		const response = await this.vv1.getReadSignedUrl({_id: assetId}).executeSync();
		return response.signedUrl;
	}
}

export const ModuleFE_Assets = new ModuleFE_Assets_Class();
