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
import {_keys, composeQueryParams, exists, Module,} from '@thunder-storm/common';
import {createBrowserHistory, History, LocationDescriptorObject} from 'history';
import {QueryParams} from '../../shared';

import {ThunderDispatcher} from '../core/thunder-dispatcher';

export type OnUrlParamsChangedListener = {
	__onUrlParamsChanged: VoidFunction
}

export const dispatcher_urlParamsChanged = new ThunderDispatcher<OnUrlParamsChangedListener, '__onUrlParamsChanged'>('__onUrlParamsChanged');

// move all the shit from here to the Routing module
export class ModuleFE_BrowserHistory_Class
	extends Module {
	private readonly history: History<any>;

	constructor() {
		super();
		this.history = createBrowserHistory();
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
	}

	private composeQuery(queryParams: QueryParams) {
		const queryAsString = composeQueryParams(queryParams);
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
			return {key: parts[0], value: parts[1].length === 0 ? undefined : parts[1]};
		}).reduce((toRet, param) => {
			toRet[param.key] = param.value;
			return toRet;
		}, queryParams);
	};

	getQueryParams() {
		const params = this.getEncodedQueryParams();
		_keys(params).forEach(key => {
			const _param = params[key];
			if (!exists(_param))
				return;

			const value = `${params[key]}`;
			params[key] = decodeURIComponent(value);
		});
		return params;
	}

	setQuery(queryParams: QueryParams) {
		const encodedQueryParams = encodeUrlParams(queryParams);

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

	getQueryParameter(key: string) {
		const queryParams = ModuleFE_BrowserHistory.getQueryParams();
		const value = queryParams[key];
		if (value === undefined && Object.keys(queryParams).includes(key))
			return null;

		return value;
	}

	getCurrentUrl() {
		return ModuleFE_BrowserHistory.getCurrent().pathname;
	}
}

export function getCurrentUrl() {
	return ModuleFE_BrowserHistory.getCurrentUrl();
}

export function getQueryParameter(name: string) {
	return ModuleFE_BrowserHistory.getQueryParameter(name);
}

export function getUrlQuery() {
	return ModuleFE_BrowserHistory.getQueryParams();
}

export function encodeUrlParams(queryParams?: QueryParams) {
	const encodedQueryParams = {...queryParams};
	_keys(encodedQueryParams).forEach(key => {
		const value = encodedQueryParams[key];
		if (!value) {
			delete encodedQueryParams[key];
			return;
		}

		encodedQueryParams[key] = encodeURIComponent(value);
	});
	return encodedQueryParams;
}

export function composeQuery(queryParams?: QueryParams) {
	const queryAsString = composeQueryParams(queryParams);
	if (queryAsString.length === 0)
		return '';

	return queryAsString;
}

export function composeURL(url: string, queryParams?: QueryParams) {
	const queryAsString = composeQuery(queryParams);
	return `${url}${queryAsString.length > 0 ? `?${queryAsString}` : ''}`;
}

export const ModuleFE_BrowserHistory = new ModuleFE_BrowserHistory_Class();