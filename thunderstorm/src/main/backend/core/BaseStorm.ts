/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import {merge, ModuleManager, TS_Object} from '@nu-art/ts-common';
import {DatabaseWrapperBE, ModuleBE_Firebase} from '@nu-art/firebase/backend';


export abstract class BaseStorm
	extends ModuleManager {

	protected envKey: string = 'dev';
	protected version: string = '';
	private override: TS_Object = {};
	readonly isDebug = false;

	setEnvironment(envKey: string) {
		this.envKey = envKey;
		return this;
	}

	getEnvironment() {
		return this.envKey;
	}

	setVersion(version: string) {
		this.version = version;
		return this;
	}

	getVersion() {
		return this.version;
	}

	setOverride(override: TS_Object) {
		this.override = override;
	}

	protected resolveConfig = async () => {
		const database: DatabaseWrapperBE = ModuleBE_Firebase.createAdminSession().getDatabase();
		let initialized = 0;

		const listener = (resolve: (value: unknown) => void) => (snapshot: any) => {
			if (initialized >= 2) {
				this.logWarning('CONFIGURATION HAS CHANGED... KILLING PROCESS!!!');
				process.exit(2);
			}

			resolve(snapshot || {});

			initialized++;
		};

		const defaultPromise = new Promise((resolve) => {
			database.listen(`/_config/default`, listener(resolve));
		});
		const envPromise = new Promise((resolve) => {
			database.listen(`/_config/${this.envKey}`, listener(resolve));
		});
		const [
			defaultConfig,
			overrideConfig
		] = await Promise.all(
			[
				defaultPromise,
				envPromise
			]
		);

		const merge1 = merge(defaultConfig, overrideConfig);
		this.setConfig(merge(merge1, this.override) || {});
	};
}