/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {_setTimeout, ImplementationMissingException, Module, Second, StringMap} from '@nu-art/ts-common';
import {ThunderDispatcher,} from '@nu-art/thunderstorm/app-frontend/core/thunder-dispatcher';
import {apiWithBody, apiWithQuery,} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller, HttpException} from '@nu-art/thunderstorm';
import {ApiDef_Permissions, ApiStruct_Permissions, UserUrlsPermissions} from '../..';


export type PermissionsModuleFEConfig = {
	projectId: string
}

export interface OnPermissionsChanged {
	__onPermissionsChanged: () => void;
}

export interface OnPermissionsFailed {
	__onPermissionsFailed: () => void;
}

const dispatch_onPermissionsChanged = new ThunderDispatcher<OnPermissionsChanged, '__onPermissionsChanged'>('__onPermissionsChanged');
const dispatch_onPermissionsFailed = new ThunderDispatcher<OnPermissionsFailed, '__onPermissionsFailed'>('__onPermissionsFailed');

export class PermissionsModuleFE_Class
	extends Module<PermissionsModuleFEConfig> {
	private loadingUrls = new Set<string>();
	private userUrlsPermissions: UserUrlsPermissions = {};
	private requestCustomField: StringMap = {};
	private debounceTime = 100;
	private retryCounter = 0;
	readonly v1: ApiDefCaller<ApiStruct_Permissions>['v1'];

	constructor() {
		super();

		this.v1 = {
			getUserUrlsPermissions: apiWithBody(ApiDef_Permissions.v1.getUserUrlsPermissions),
			getUserCFsByShareGroups: apiWithBody(ApiDef_Permissions.v1.getUserCFsByShareGroups),
			getUsersCFsByShareGroups: apiWithBody(ApiDef_Permissions.v1.getUsersCFsByShareGroups),
			registerExternalProject: apiWithBody(ApiDef_Permissions.v1.registerExternalProject),
			registerProject: apiWithQuery(ApiDef_Permissions.v1.registerProject),
		};
	}


	setDebounceTime(time: number) {
		this.debounceTime = time;
	}

	setCustomField(key: string, value: string) {
		this.requestCustomField[key] = value;
		this.setPermissions();
	}

	loadUrls(urls: string[]) {
		urls.forEach(url => {
			if (this.loadingUrls.has(url) || this.userUrlsPermissions[url] !== undefined)
				return;

			this.loadingUrls.add(url);
		});

		this.setPermissions();
	}

	doesUserHavePermissions(url: string): boolean | undefined {
		if (this.loadingUrls.has(url))
			return undefined;

		const permitted = this.userUrlsPermissions[url];
		if (permitted !== undefined)
			return permitted;

		this.loadingUrls.add(url);
		this.setPermissions();
		return undefined;
	}

	private setPermissions = () => {
		if (!this.config || !this.config.projectId)
			throw new ImplementationMissingException('need to set up a project id config');

		this.debounce(() => {
			const urls: UserUrlsPermissions = {};
			this.loadingUrls.forEach(url => {
				urls[url] = false;
			});
			const query = {
				projectId: this.config.projectId,
				urls: urls,
				requestCustomField: this.requestCustomField
			};
			this.v1.getUserUrlsPermissions(query).execute(
				//On Success
				async (response: UserUrlsPermissions, data?: (string | undefined)) => {
					this.retryCounter = 0;
					Object.keys(response).forEach(url => {
						this.loadingUrls.delete(url);
						this.userUrlsPermissions[url] = response[url];
					});
					dispatch_onPermissionsChanged.dispatchUI();
				},
				//On Error
				(reason: HttpException) => {
					this.logWarning(`Failed to get user urls permissions`);
					if (this.retryCounter < 5) {
						this.retryCounter++;
						return _setTimeout(this.setPermissions, 5 * Second);
					}
					dispatch_onPermissionsFailed.dispatchModule();
				}
			);
		}, 'get-permissions', this.debounceTime);
	};

}

export const PermissionsFE = new PermissionsModuleFE_Class();