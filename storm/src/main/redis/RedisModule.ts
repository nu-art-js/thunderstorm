/*
 * Storm contains a list of utility functions.. this project
 * might be broken down into more smaller projects in the future.
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

/**
 * Created by tacb0ss on 07/07/2018.
 */


// Perhaps we may need to change this especially if it should be able to
// be used as a standalone package.
import {createClient} from "redis";
import {Module} from "@nu-art/ts-common";

type ConfigType = { port: number, host: string };

export class RedisModule_Class
	extends Module<ConfigType> {
	private client: any;

	constructor() {
		super("redis");
	}

	public async get(key: string): Promise<object> {
		await this.connect();
		return this.client.get(key)
	}

	public async put(key: string, value: object) {
		await this.connect();
		return this.client.set(key, value)
	}

	public async dropCache() {
		await this.connect();
		return this.client.flushall();
	}

	private async connect() {
		if (this.client)
			return;

		return new Promise<void>((resolve, rejected) => {
			try {
				this.client = createClient(this.config.port, this.config.host);
			} catch (e:any) {
				rejected(e)
			}
			return this.client.on('connect');
		});
	}

	public async terminate() {
		if (!this.client)
			return;

		return new Promise<void>(() => {
			return this.client.on('disconnect');
		}).then((resolve: any) => {
			this.client = null;
			this.logInfo("Mongo connection terminated");
			resolve();
		});
	}
}

export const RedisModule = new RedisModule_Class();
