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
import {_keys, Module,} from '@nu-art/ts-common';
import {createBrowserHistory, History, LocationDescriptorObject} from 'history';
import {QueryParams} from '../../index';

// move all the shit from here to the Routing module
export class BrowserHistoryModule_Class
	extends Module {
	private readonly history: History<any>;

	constructor() {
		super();
		this.history = createBrowserHistory();
	}

	push(push: LocationDescriptorObject) {
		this.history.push(push);
	}

	replace(push: LocationDescriptorObject) {
		this.history.replace(push);
	}

	private composeQuery(queryParams: QueryParams) {
		const queryAsString = _keys(queryParams).map((key) => `${key}=${queryParams[key]}`).join('&');
		if (queryAsString.length === 0)
			return undefined;

		return queryAsString;
	}

	private getEncodedQueryParams = (): QueryParams => {
		const queryParams: QueryParams = {};
		let queryAsString = window.location.search;
		if (!queryAsString || queryAsString.length === 0)
			return {};

		while (queryAsString.startsWith('?') || queryAsString.startsWith('/?')) {
			if (queryAsString.startsWith('?'))
				queryAsString = queryAsString.substring(1);
			else if (queryAsString.startsWith('/?'))
				queryAsString = queryAsString.substring(2);
			else
				break;
		}

		const query = queryAsString.split('&');
		return query.map(param => {
			const parts = param.split('=');
			return {key: parts[0], value: parts[1]};
		}).reduce((toRet, param) => {
			if (param.key && param.value)
				toRet[param.key] = param.value;

			return toRet;
		}, queryParams);
	};

	getQueryParams() {
		const params = this.getEncodedQueryParams();
		_keys(params).forEach(key => {
			const value = params[key];
			if (!value) {
				delete params[key];
				return;
			}

			params[key] = decodeURIComponent(value);
		});
		return params;
	}

	setQuery(queryParams: QueryParams) {
		const encodedQueryParams = {...queryParams};
		_keys(encodedQueryParams).forEach(key => {
			const value = encodedQueryParams[key];
			if (!value) {
				delete encodedQueryParams[key];
				return;
			}

			encodedQueryParams[key] = encodeURIComponent(value);
		});

		this.updateQueryParams(encodedQueryParams);
	}

	addQueryParam(key: string, value: string) {
		const encodedQueryParams = this.getEncodedQueryParams();
		encodedQueryParams[key] = encodeURIComponent(value);

		this.updateQueryParams(encodedQueryParams);
	}

	removeQueryParam(key: string) {
		const encodedQueryParams = this.getEncodedQueryParams();
		delete encodedQueryParams[key];

		const data = this.createHistoryDataFromQueryParams(encodedQueryParams);

		this.replace(data);
	}

	setUrl(url: string, queryParams?: QueryParams) {
		this.push(this.createHistoryDataFromQueryParams(queryParams, url));
	}

	private createHistoryDataFromQueryParams(encodedQueryParams?: QueryParams, pathname: string = window.location.pathname) {
		return {
			pathname: !pathname.endsWith('/') ? pathname : pathname.substring(0, pathname.length - 1),
			search: !encodedQueryParams ? '' : this.composeQuery(encodedQueryParams)
		};
	}

	private updateQueryParams(encodedQueryParams: QueryParams) {
		const data = this.createHistoryDataFromQueryParams(encodedQueryParams);

		this.replace(data);
	}

	getOrigin() {
		return window.location.origin;
	}

	getCurrent() {
		return this.history.location;
	}

	getHistory() {
		return this.history;
	}

	getQueryParameter(name: string) {
		return BrowserHistoryModule.getQueryParams()[name];
	}

	getCurrentUrl() {
		return BrowserHistoryModule.getCurrent().pathname;
	}
}

export const BrowserHistoryModule = new BrowserHistoryModule_Class();