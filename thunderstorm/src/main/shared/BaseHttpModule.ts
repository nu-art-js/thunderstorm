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
// noinspection TypeScriptPreferShortImport
import {ApiDef, TypedApi} from './types';

import {BadImplementationException, Module,} from '@nu-art/ts-common';
import {BaseHttpRequest} from './BaseHttpRequest';


type HttpConfig = {
	origin?: string
	timeout?: number
	compress?: boolean
}

export abstract class BaseHttpModule_Class<Config extends HttpConfig = HttpConfig>
	extends Module<Config> {

	protected origin!: string;
	protected timeout: number = 10000;
	private readonly defaultHeaders: { [s: string]: (() => string | string[]) | string | string[] } = {};
	protected defaultOnComplete?: (response: unknown, input: unknown, request: BaseHttpRequest<any>) => Promise<any>;

	constructor() {
		super();
		this.setDefaultConfig({compress: true} as Partial<Config>);
	}

	init() {
		this.timeout = this.config.timeout || this.timeout;
	}

	getOrigin() {
		return this.origin;
	}

	shouldCompress() {
		return this.config.compress;
	}

	setDefaultOnComplete(defaultOnComplete: (response: unknown, input: unknown, request: BaseHttpRequest<any>) => Promise<any>) {
		this.defaultOnComplete = defaultOnComplete;
	}

	addDefaultHeader(key: string, header: (() => string | string[]) | string | string[]) {
		this.defaultHeaders[key] = header;
	}

	protected getDefaultHeaders() {
		return Object.keys(this.defaultHeaders).reduce((toRet, _key) => {
			const defaultHeader = this.defaultHeaders[_key];
			switch (typeof defaultHeader) {
				case 'string':
					toRet[_key] = [defaultHeader];
					break;

				case 'function':
					toRet[_key] = defaultHeader();
					break;

				case 'object':
					if (Array.isArray(defaultHeader)) {
						toRet[_key] = defaultHeader;
						break;
					}

				// eslint-disable-next-line no-fallthrough
				case 'boolean':
				case 'number':
				case 'symbol':
				case 'bigint':
				case 'undefined':
					throw new BadImplementationException('Headers values can only be of type: (() => string | string[]) | string | string[] ');
			}

			return toRet;
		}, {} as { [k: string]: string | string[] });
	}

	abstract createRequest<API extends TypedApi<any, any, any, any>>(apiDef: ApiDef<API>, data?: any): BaseHttpRequest<API>

}
