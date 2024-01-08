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
import {compare, merge, Module, RecursiveObjectOfPrimitives} from '@nu-art/ts-common';
import {createBrowserHistory, History, LocationDescriptorObject} from 'history';
import {gzip, ungzip} from 'pako';
import {ThunderDispatcher} from '../core/thunder-dispatcher';

type AdvancedQueryParam = RecursiveObjectOfPrimitives;

export class QueryParamKey<T extends AdvancedQueryParam> {
	private readonly key: string;

	constructor(key: string) {
		this.key = key;
	}

	// @ts-ignore
	get(): T {
		return ModuleFE_BrowserHistoryV2.get(this.key) as T;
	}

	set(value: T) {
		return ModuleFE_BrowserHistoryV2.set(this.key, value);
	}

	update(value: T) {
		return ModuleFE_BrowserHistoryV2.update({[this.key]: value});
	}

	delete() {
		return ModuleFE_BrowserHistoryV2.delete(this.key);
	}
}

export type OnUrlParamsChangedListenerV2 = {
	__onUrlParamsChangedV2: VoidFunction
}

export const dispatcher_urlParamsChangedV2 = new ThunderDispatcher<OnUrlParamsChangedListenerV2, '__onUrlParamsChangedV2'>('__onUrlParamsChangedV2');

export class ModuleFE_BrowserHistoryV2_Class
	extends Module {
	private readonly history: History<any>;
	private state: AdvancedQueryParam;

	constructor() {
		super();
		this.history = createBrowserHistory();
		this.state = this.decode();
	}

	private decode(hash: string = window.location.hash): any {
		if (!hash || hash.length === 0)
			return {};

		return JSON.parse(new TextDecoder('utf8').decode(ungzip(Uint8Array.from(window.atob(hash || window.location.hash), c => c.charCodeAt(0)))));
	}

	private encode(state = this.state): any {
		this.state = state;
		window.location.hash = window.btoa(new Uint8Array(gzip(JSON.stringify(this.state))).reduce((acc, byte) => acc + String.fromCharCode(byte), ''));
		dispatcher_urlParamsChangedV2.dispatchUI();
	}

	/**
	 * Update and navigate according to query params
	 */
	push(push: LocationDescriptorObject) {
		this.history.push(push);
	}

	/**
	 * Update query params
	 */
	replace(push: LocationDescriptorObject) {
		this.history.replace(push);
		const lastState = this.state;
		this.state = this.decode();

		if (!compare(this.state, lastState))
			dispatcher_urlParamsChangedV2.dispatchUI();
	}

	update(queryParams: AdvancedQueryParam) {
		this.state = merge(this.state, queryParams);
		this.encode();
	}

	set(key: string, queryParams: AdvancedQueryParam) {
		this.state[key] = queryParams;
		this.encode();
	}

	get(key: string) {
		return this.state[key];
	}

	delete(key: string) {
		delete this.state[key];
		this.encode();
	}

	setState = (state: AdvancedQueryParam) => {
		this.encode(state);
	};

	getState = () => ({...this.state});
}

export const ModuleFE_BrowserHistoryV2 = new ModuleFE_BrowserHistoryV2_Class();