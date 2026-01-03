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
 *
 * @deprecated This module is deprecated. Use ModuleFE_RoutingV2 instead.
 *
 * Migration Guide:
 *
 * Query Parameters:
 * - ModuleFE_BrowserHistory.getQueryParams() → ModuleFE_RoutingV2.getQueryParams()
 * - ModuleFE_BrowserHistory.getQueryParameter(key) → ModuleFE_RoutingV2.getQueryParameter(key)
 * - ModuleFE_BrowserHistory.setQuery(params) → ModuleFE_RoutingV2.setQuery(params)
 * - ModuleFE_BrowserHistory.addQueryParam(key, value) → ModuleFE_RoutingV2.addQueryParam(key, value)
 * - ModuleFE_BrowserHistory.removeQueryParam(key) → ModuleFE_RoutingV2.removeQueryParam(key)
 *
 * URL Utilities:
 * - ModuleFE_BrowserHistory.getCurrent() → ModuleFE_RoutingV2.getCurrent()
 * - ModuleFE_BrowserHistory.getCurrentUrl() → ModuleFE_RoutingV2.getCurrentUrl()
 * - ModuleFE_BrowserHistory.getOrigin() → ModuleFE_RoutingV2.getOrigin()
 *
 * Navigation:
 * - ModuleFE_BrowserHistory.push(location) → ModuleFE_RoutingV2.push(location)
 * - ModuleFE_BrowserHistory.replace(location) → ModuleFE_RoutingV2.replace(location)
 * - ModuleFE_BrowserHistory.setUrl(url, params) → Use ModuleFE_RoutingV2.push({pathname: url, search: ...})
 *
 * Utility Functions:
 * - composeURL(url, params) → ModuleFE_RoutingV2.composeURL(url, params) (or import from routing module)
 * - encodeUrlParams(params) → ModuleFE_RoutingV2.encodeUrlParams(params) (or import from routing module)
 * - composeQuery(params) → ModuleFE_RoutingV2.composeQuery(params) (or import from routing module)
 *
 * This module will be removed in a future version. Please migrate to ModuleFE_RoutingV2.
 */
import {_keys, composeQueryParams, exists, Module,} from '@nu-art/ts-common';
import {createBrowserHistory, History, LocationDescriptorObject} from 'history';
import {ThunderDispatcher} from '../thunder-dispatcher.js';
import {encodeUrlParams} from '@nu-art/ts-common';

export type UrlQueryParams = { [key: string]: string | undefined; };

export type OnUrlParamsChangedListener = {
	__onUrlParamsChanged: VoidFunction
}

export const dispatcher_urlParamsChanged = new ThunderDispatcher<OnUrlParamsChangedListener, '__onUrlParamsChanged'>('__onUrlParamsChanged');

/**
 * @deprecated Use ModuleFE_RoutingV2 instead. This class will be removed in a future version.
 *
 * All functionality has been migrated to ModuleFE_RoutingV2. See file-level deprecation notice for migration guide.
 */
export class ModuleFE_BrowserHistory_Class
	extends Module {
	private readonly history: History<any>;

	constructor() {
		super();
		this.history = createBrowserHistory();
	}

	/**
	 * Update and navigate according to query params
	 *
	 * @deprecated Use ModuleFE_RoutingV2.push() instead
	 *
	 * Migration:
	 * // Old:
	 * ModuleFE_BrowserHistory.push({pathname: '/path', search: '?key=value'});
	 *
	 * // New:
	 * ModuleFE_RoutingV2.push({pathname: '/path', search: '?key=value'});
	 */
	push(push: LocationDescriptorObject) {
		this.history.push(push);
	}

	/**
	 * Update query params
	 *
	 * @deprecated Use ModuleFE_RoutingV2.replace() instead
	 *
	 * Migration:
	 * // Old:
	 * ModuleFE_BrowserHistory.replace({pathname: '/path', search: '?key=value'});
	 *
	 * // New:
	 * ModuleFE_RoutingV2.replace({pathname: '/path', search: '?key=value'});
	 */
	replace(push: LocationDescriptorObject) {
		this.history.replace(push);
	}

	private composeQuery(queryParams: UrlQueryParams) {
		const queryAsString = composeQueryParams(queryParams);
		if (queryAsString.length === 0)
			return undefined;

		return queryAsString;
	}

	private getEncodedQueryParams = (): UrlQueryParams => {
		const queryParams: UrlQueryParams = {};
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

	/**
	 * Get all query parameters from the current URL (decoded)
	 *
	 * @deprecated Use ModuleFE_RoutingV2.getQueryParams() instead
	 *
	 * Migration:
	 * // Old:
	 * const params = ModuleFE_BrowserHistory.getQueryParams();
	 *
	 * // New:
	 * const params = ModuleFE_RoutingV2.getQueryParams();
	 */
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

	/**
	 * Replace all query parameters on the current route
	 *
	 * @deprecated Use ModuleFE_RoutingV2.setQuery() instead
	 *
	 * Migration:
	 * // Old:
	 * ModuleFE_BrowserHistory.setQuery({key: 'value'});
	 *
	 * // New:
	 * ModuleFE_RoutingV2.setQuery({key: 'value'});
	 */
	setQuery(queryParams: UrlQueryParams) {
		const encodedQueryParams = encodeUrlParams(queryParams);

		this.updateQueryParams(encodedQueryParams);
	}

	/**
	 * Add or update a single query parameter on the current route
	 *
	 * @deprecated Use ModuleFE_RoutingV2.addQueryParam() instead
	 *
	 * Migration:
	 * // Old:
	 * ModuleFE_BrowserHistory.addQueryParam('key', 'value');
	 *
	 * // New:
	 * ModuleFE_RoutingV2.addQueryParam('key', 'value');
	 */
	addQueryParam(key: string, value: string) {
		const decodedQueryParams = this.getQueryParams();
		decodedQueryParams[key] = value;

		this.updateQueryParams(decodedQueryParams);
	}

	/**
	 * Remove a single query parameter from the current route
	 *
	 * @deprecated Use ModuleFE_RoutingV2.removeQueryParam() instead
	 *
	 * Migration:
	 * // Old:
	 * ModuleFE_BrowserHistory.removeQueryParam('key');
	 *
	 * // New:
	 * ModuleFE_RoutingV2.removeQueryParam('key');
	 */
	removeQueryParam(key: string) {
		const encodedQueryParams = this.getEncodedQueryParams();
		delete encodedQueryParams[key];

		const data = this.createHistoryDataFromQueryParams(encodedQueryParams);

		this.replace(data);
	}

	/**
	 * Set URL with optional query parameters
	 *
	 * @deprecated Use ModuleFE_RoutingV2.push() instead
	 *
	 * Migration:
	 * // Old:
	 * ModuleFE_BrowserHistory.setUrl('/path', {key: 'value'});
	 *
	 * // New:
	 * const search = ModuleFE_RoutingV2.composeQuery({key: 'value'});
	 * ModuleFE_RoutingV2.push({pathname: '/path', search: search ? `?${search}` : ''});
	 */
	setUrl(url: string, queryParams?: UrlQueryParams) {
		this.push(this.createHistoryDataFromQueryParams(queryParams, url));
	}

	private createHistoryDataFromQueryParams(encodedQueryParams?: UrlQueryParams, pathname: string = window.location.pathname) {
		return {
			pathname: !pathname.endsWith('/') ? pathname : pathname.substring(0, pathname.length - 1),
			search: !encodedQueryParams ? '' : this.composeQuery(encodedQueryParams)
		};
	}

	private updateQueryParams(encodedQueryParams: UrlQueryParams) {
		const data = this.createHistoryDataFromQueryParams(encodedQueryParams);

		this.replace(data);
	}

	/**
	 * Get the window origin
	 *
	 * @deprecated Use ModuleFE_RoutingV2.getOrigin() instead
	 *
	 * Migration:
	 * // Old:
	 * const origin = ModuleFE_BrowserHistory.getOrigin();
	 *
	 * // New:
	 * const origin = ModuleFE_RoutingV2.getOrigin();
	 */
	getOrigin() {
		return window.location.origin;
	}

	/**
	 * Get the current location object
	 *
	 * @deprecated Use ModuleFE_RoutingV2.getCurrent() instead
	 *
	 * Migration:
	 * // Old:
	 * const location = ModuleFE_BrowserHistory.getCurrent();
	 *
	 * // New:
	 * const location = ModuleFE_RoutingV2.getCurrent();
	 */
	getCurrent() {
		return this.history.location;
	}

	/**
	 * Get the history object (internal use)
	 *
	 * @deprecated This method is deprecated. The history object is no longer exposed.
	 * If you need navigation functionality, use ModuleFE_RoutingV2 methods instead.
	 */
	getHistory() {
		return this.history;
	}

	/**
	 * Get a single query parameter from the current URL
	 *
	 * @deprecated Use ModuleFE_RoutingV2.getQueryParameter() instead
	 *
	 * Migration:
	 * // Old:
	 * const value = ModuleFE_BrowserHistory.getQueryParameter('key');
	 *
	 * // New:
	 * const value = ModuleFE_RoutingV2.getQueryParameter('key');
	 */
	getQueryParameter(key: string) {
		const queryParams = ModuleFE_BrowserHistory.getQueryParams();
		const value = queryParams[key];
		if (value === undefined && Object.keys(queryParams).includes(key))
			return null;

		return value;
	}

	/**
	 * Get the current URL pathname
	 *
	 * @deprecated Use ModuleFE_RoutingV2.getCurrentUrl() instead
	 *
	 * Migration:
	 * // Old:
	 * const url = ModuleFE_BrowserHistory.getCurrentUrl();
	 *
	 * // New:
	 * const url = ModuleFE_RoutingV2.getCurrentUrl();
	 */
	getCurrentUrl() {
		return ModuleFE_BrowserHistory.getCurrent().pathname;
	}
}

/**
 * @deprecated Use ModuleFE_RoutingV2.getCurrentUrl() instead
 *
 * Migration:
 * // Old:
 * const url = getCurrentUrl();
 *
 * // New:
 * import {ModuleFE_RoutingV2} from "@nu-art/thunder-routing";
 * const url = ModuleFE_RoutingV2.getCurrentUrl();
 */
export function getCurrentUrl() {
	return ModuleFE_BrowserHistory.getCurrentUrl();
}

/**
 * @deprecated Use ModuleFE_RoutingV2.getQueryParameter() instead
 *
 * Migration:
 * // Old:
 * const value = getQueryParameter('key');
 *
 * // New:
 * import {ModuleFE_RoutingV2} from "@nu-art/thunder-routing";
 * const value = ModuleFE_RoutingV2.getQueryParameter('key');
 */
export function getQueryParameter(name: string) {
	return ModuleFE_BrowserHistory.getQueryParameter(name);
}

/**
 * @deprecated Use ModuleFE_RoutingV2.getQueryParams() instead
 *
 * Migration:
 * // Old:
 * const params = getUrlQuery();
 *
 * // New:
 * import {ModuleFE_RoutingV2} from "@nu-art/thunder-routing";
 * const params = ModuleFE_RoutingV2.getQueryParams();
 */
export function getUrlQuery() {
	return ModuleFE_BrowserHistory.getQueryParams();
}

export const ModuleFE_BrowserHistory = new ModuleFE_BrowserHistory_Class();
