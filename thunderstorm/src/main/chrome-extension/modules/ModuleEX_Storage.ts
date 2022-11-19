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

/**
 * Created by tacb0ss on 27/07/2018.
 */
import {merge, Module, TS_Object} from '@nu-art/ts-common';


export interface StorageKeyEvent {
	__onStorageKeyEvent(event: StorageEvent): void;
}

export class ModuleEX_Storage_Class
	extends Module {

	protected init(): void {
	}

	getStorage = () => chrome.storage.sync;

	async set(key: string, value: string | number | object) {
		if (value === undefined)
			return this.delete(key);

		return this.getStorage().set({[key]: value});
	}

	async delete(key: string) {
		return this.getStorage().set({[key]: undefined});
	}

	public async get(key: string, defaultValue?: string | number | object): Promise<string | number | object | null> {
		const keys = defaultValue ? {[key]: defaultValue} : key;
		return (await this.getStorage().get(keys))[key];
	}
}

export const ModuleEX_Storage = new ModuleEX_Storage_Class();

//TODO Generic Keys like in the tests contexts
export class StorageKeyEX<ValueType = string | number | object> {
	private readonly key: string;

	constructor(key: string) {
		this.key = key;
	}

	async get(defaultValue?: ValueType): Promise<ValueType> {
		return (await ModuleEX_Storage.get(this.key, defaultValue as string | number | object)) as unknown as ValueType;
	}

	async patch(value: ValueType extends TS_Object ? Partial<ValueType> : ValueType) {
		const previousValue = await this.get();
		const mergedValue = merge(previousValue, value);
		await this.set(mergedValue);
		return mergedValue;
	}

	async set(value: ValueType) {
		// @ts-ignore
		await ModuleEX_Storage.set(this.key, value);
		// console.log('StorageKey', this.key);
		return value;
	}

	async delete() {
		return ModuleEX_Storage.delete(this.key);
	}
}

