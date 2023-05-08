/*
 * A typescript & react boilerplate with api call example
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

import {apiWithBody, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {_values, BadImplementationException, MUSTNeverHappenException, TypedMap} from '@nu-art/ts-common';
import {DBApiDefGeneratorIDB} from '@nu-art/db-api-generator/shared';
import {ApiCallerEventTypeV2, BaseDB_ApiCaller, DBApiFEConfig} from '@nu-art/db-api-generator/frontend';
import {PanelConfig} from '..';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {DBDef_Workspaces} from '../../shared/db-def';
import {DB_Workspace} from '../../shared/types';


export interface OnWorkspaceUpdated {
	__onWorkspaceUpdated: (...params: ApiCallerEventTypeV2<DB_Workspace>) => void;
}

export const dispatch_onWorkspaceUpdated = new ThunderDispatcher<OnWorkspaceUpdated, '__onWorkspaceUpdated'>('__onWorkspaceUpdated', true);

type Config = DBApiFEConfig<DB_Workspace, 'key' | 'accountId'> & { defaultConfigs: TypedMap<PanelConfig> };

export class ModuleFE_Workspace_Class
	extends BaseDB_ApiCaller<DB_Workspace, 'key' | 'accountId', Config> {

	private workspacesToUpsert: TypedMap<any> = {};
	private upsertRunnable: any;

	constructor() {
		super(DBDef_Workspaces, dispatch_onWorkspaceUpdated);

		const sync = apiWithBody(DBApiDefGeneratorIDB<DB_Workspace, 'key' | 'accountId'>(DBDef_Workspaces).v1.sync);

		this.v1.sync = () => {
			return sync({where: {accountId: this.getCurrentAccountId()}});
		};
	}

	private getCurrentAccountId = (): string => {
		return ModuleFE_Account.accountId;
	};

	private assertLoggedInUser = () => {
		if (!this.getCurrentAccountId) {
			throw new BadImplementationException('Trying to get workspace while not having user logged in, fix this');
		}
	};

	public getWorkspaceConfigByKey = async (key: string): Promise<PanelConfig<any>> => {
		this.assertLoggedInUser();
		const workspace = await this.getWorkspaceByKey(key);
		const config = workspace?.config || this.config.defaultConfigs[key];
		if (!config)
			throw new BadImplementationException(`Could not find config for key ${key}`);

		return config;
	};

	private getWorkspaceByKey = async (key: string): Promise<DB_Workspace | undefined> => {
		this.assertLoggedInUser();
		return await this.IDB.find(workspace => workspace.key === key && workspace.accountId === this.getCurrentAccountId());
	};

	public setWorkspaceByKey = async (key: string, config: PanelConfig<any>) => {
		let accountId = this.getCurrentAccountId();
		if (!accountId)
			accountId = (this.getCurrentAccountId());
		if (accountId.length < 1)
			throw new MUSTNeverHappenException('Trying to upsert a workspace, with no account id!');

		this.workspacesToUpsert[key] = {key: key, accountId: accountId, config: config};

		clearTimeout(this.upsertRunnable);

		this.upsertRunnable = setTimeout(async () => {
			const values = _values(this.workspacesToUpsert);
			this.logInfo(values);
			await this.v1.upsertAll(values).executeSync();
			this.workspacesToUpsert = {};
		}, 500);
	};

	public deleteWorkspaceByKey = async (key: string) => {
		const toDelete = await this.getWorkspaceByKey(key);
		if (toDelete)
			return await this.v1.delete(toDelete).executeSync();
	};
}

export const ModuleFE_Workspace = new ModuleFE_Workspace_Class();
