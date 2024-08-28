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

import {StorageKey} from '@thunder-storm/core/frontend';
import {_values, BadImplementationException, Module, TypedMap} from '@thunder-storm/common';
import {PanelConfig} from '..';
import {Workspace} from '../../shared/types';


type Config = {
	defaultConfigs: TypedMap<PanelConfig>,
	accountResolver: () => string,
};

export class ModuleFE_Workspace_Class
	extends Module<Config> {

	private workspacesToUpsert: TypedMap<any> = {};
	private upsertRunnable: any;
	private accountResolver!: () => string;

	setAccountResolver(resolver: () => string) {
		this.accountResolver = resolver;
	}

	private getCurrentAccountId = (): string => {
		return this.accountResolver();
	};

	private assertLoggedInUser = (logActionString: 'get' | 'set' = 'get') => {
		if (!this.getCurrentAccountId()) {
			throw new BadImplementationException(`Trying to ${logActionString} workspace while not having user logged in, fix this`);
		}
	};

	public getWorkspaceConfigByKey = (key: string): PanelConfig<any> => {
		this.assertLoggedInUser();
		const workspace = this.getWorkspaceByKey(key);
		const config = workspace?.config || this.config.defaultConfigs[key];
		if (!config)
			throw new BadImplementationException(`Could not find config for key ${key}`);

		return config;
	};

	private getWorkspaceByKey = (key: string): Workspace | undefined => {
		this.assertLoggedInUser();

		return this.getStorageKeyForWorkspace(key).get();
	};

	private getStorageKeyForWorkspace = (key: string): StorageKey<Workspace> => new StorageKey<Workspace>(`workspace_key__${key}`);

	public setWorkspaceByKey = async (key: string, config: PanelConfig<any>) => {
		this.assertLoggedInUser('set');


		this.workspacesToUpsert[key] = {key: key, config: config};

		clearTimeout(this.upsertRunnable);

		this.upsertRunnable = setTimeout(async () => {
			const values = _values(this.workspacesToUpsert);
			values.forEach(workspace => {
				this.logInfo('SET WORKSPACE KEY', `KEY: ${workspace.key}`);
				this.getStorageKeyForWorkspace(workspace.key).set(workspace);
			});
			this.workspacesToUpsert = {};
		}, 500);
	};

	public deleteWorkspaceByKey = async (key: string) => {
		this.getStorageKeyForWorkspace(key).delete();
	};
}

export const ModuleFE_Workspace = new ModuleFE_Workspace_Class();
