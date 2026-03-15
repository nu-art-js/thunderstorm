/*
 * Thunderstorm is a full web app framework!
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

import {merge, Module, ModuleManager, TS_Object} from '@nu-art/ts-common';
import {DatabaseWrapperBE, ModuleBE_Firebase} from '@nu-art/firebase-backend';

export type StormConfig = {
	envKey: string;
	pathToDefaultConfig: string;
	pathToEnvOverrideConfig: string;
};

export abstract class BaseStorm
	extends ModuleManager {

	protected innerConfig: StormConfig;
	private override: TS_Object = {};
	readonly isDebug = false;

	constructor(config: StormConfig | string) {
		super();
		if (typeof config === 'string') {
			this.innerConfig = {
				envKey: config,
				pathToDefaultConfig: '_config/default',
				pathToEnvOverrideConfig: `_config/${config}`
			};
		} else {
			const c = {...config};
			if (c.pathToDefaultConfig.startsWith('/'))
				c.pathToDefaultConfig = c.pathToDefaultConfig.substring(1);
			if (c.pathToEnvOverrideConfig.startsWith('/'))
				c.pathToEnvOverrideConfig = c.pathToEnvOverrideConfig.substring(1);
			this.innerConfig = c;
		}
	}

	public getEnvironment(): string {
		return this.innerConfig.envKey;
	}

	setOverride(override: TS_Object) {
		this.override = override;
	}

	protected resolveConfig = async () => {
		const database: DatabaseWrapperBE = ModuleBE_Firebase.createAdminSession().getDatabase();
		this.logInfo(`LOADING RTDB FROM: ${database.getUrl()}`);

		let initialized = 0;
		const listener = (resolve: (value: unknown) => void) => (snapshot: unknown) => {
			if (initialized >= 2) {
				this.logWarning('CONFIGURATION HAS CHANGED... KILLING PROCESS!!!');
				process.exit(2);
			}
			resolve(snapshot ?? {});
			initialized++;
		};

		const defaultPromise = new Promise<TS_Object>((resolve) => {
			this.logInfo(`Loading default config from: ${database.getUrl()}/${this.innerConfig.pathToDefaultConfig}`);
			database.listen(`/${this.innerConfig.pathToDefaultConfig}`, listener(resolve as (value: unknown) => void));
		});
		const envPromise = new Promise<TS_Object>((resolve) => {
			this.logInfo(`Loading env override config from: ${database.getUrl()}/${this.innerConfig.pathToEnvOverrideConfig}`);
			database.listen(`/${this.innerConfig.pathToEnvOverrideConfig}`, listener(resolve as (value: unknown) => void));
		});

		const [defaultConfig, overrideConfig] = await Promise.all([defaultPromise, envPromise]);
		const merge1 = merge(defaultConfig as object, overrideConfig as object);
		this.setConfig(merge(merge1, this.override) as object || {});
	};

	getEnvConfigRef<Config>(module: Module<Config>) {
		return ModuleBE_Firebase.createAdminSession().getDatabase().ref<Config>(`/${this.innerConfig.pathToEnvOverrideConfig}/${module.getName()}`);
	}

	getGlobalEnvConfigRef() {
		return ModuleBE_Firebase.createAdminSession().getDatabase().ref<TS_Object>(`/${this.innerConfig.pathToEnvOverrideConfig}`);
	}
}
