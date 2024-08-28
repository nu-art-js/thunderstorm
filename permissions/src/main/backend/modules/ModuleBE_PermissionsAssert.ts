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

import {
	_keys,
	ApiException,
	arrayToMap,
	BadImplementationException,
	batchActionParallel,
	exists,
	filterDuplicates,
	filterInstances,
	ImplementationMissingException,
	Module,
	RuntimeModules,
	StringMap,
	TypedKeyValue,
	TypedMap
} from '@thunder-storm/common';
import {addRoutes, createBodyServerApi, ModuleBE_BaseApi_Class, ModuleBE_BaseDB, ModuleBE_SyncManager, ServerApi_Middleware} from '@thunder-storm/core/backend';
import {ApiModule, HttpMethod} from '@thunder-storm/core';
import {CollectSessionData, MemKey_AccountEmail} from '@thunder-storm/user-account/backend';
import {ApiDef_PermissionsAssert, Request_AssertApiForUser} from '../../shared';
import {MemKey_HttpRequestBody, MemKey_HttpRequestMethod, MemKey_HttpRequestQuery, MemKey_HttpRequestUrl} from '@thunder-storm/core/backend/modules/server/consts';
import {MemKey_UserPermissions, SessionKey_Permissions_BE} from '../consts';
import {PermissionKey_BE} from '../PermissionKey_BE';
import {Base_AccessLevel, DB_PermissionAccessLevel, DB_PermissionAPI, DomainToLevelValueMap, ModuleBE_PermissionAccessLevelDB, ModuleBE_PermissionAPIDB} from '../_entity';


export type UserCalculatedAccessLevel = { [domainId: string]: number };
export type GroupPairWithBaseLevelsObj = { accessLevels: Base_AccessLevel[] };
export type RequestPairWithLevelsObj = { accessLevels: DB_PermissionAccessLevel[] };

type Config = {
	strictMode?: boolean
}
/**
 * [DomainId uniqueString]: accessLevel's numerical value
 */

export type SessionData_StrictMode = TypedKeyValue<'strictMode', boolean>

export class ModuleBE_PermissionsAssert_Class
	extends Module<Config>
	implements CollectSessionData<SessionData_StrictMode> {

	private projectId!: string;
	_keys: TypedMap<boolean> = {};
	permissionKeys: TypedMap<PermissionKey_BE<any>> = {};

	// constructor() {
	// 	super();
	// 	this.setMinLevel(LogLevel.Debug);
	// }

	readonly Middleware = (keys: string[] = []): ServerApi_Middleware => async () => {
		await this.CustomMiddleware(keys, async (projectId: string) => {

			return this.assertUserPermissions(projectId, MemKey_HttpRequestUrl.get());
		})();
	};

	readonly LoadPermissionsMiddleware: ServerApi_Middleware = async () => {
		try {
			MemKey_UserPermissions.get();
		} catch (err) {
			MemKey_UserPermissions.set(SessionKey_Permissions_BE.get().domainToValueMap);
		}
	};

	readonly CustomMiddleware = (keys: string[], action: (projectId: string, customFields: StringMap) => Promise<void>): ServerApi_Middleware => async () => {
		const customFields: StringMap = {};
		let object: { [k: string]: any };
		const reqMethod = MemKey_HttpRequestMethod.get();
		switch (reqMethod) {
			case HttpMethod.POST:
			case HttpMethod.PATCH:
			case HttpMethod.PUT:
				object = MemKey_HttpRequestBody.get();
				break;

			case HttpMethod.GET:
			case HttpMethod.DELETE:
				object = MemKey_HttpRequestQuery.get();
				break;

			default:
				throw new BadImplementationException(`Generic custom fields cannot be extracted on api with method: ${reqMethod}`);
		}

		_keys(object).filter(key => keys.includes(key as string)).forEach(key => {
			const oElement = object[key];
			if (oElement === undefined || oElement === null)
				return;

			if (typeof oElement !== 'string')
				return;

			customFields[key] = oElement;
		});

		const projectId = this.projectId;
		await action(projectId, customFields);
	};

	async __collectSessionData(): Promise<SessionData_StrictMode> {
		return {key: 'strictMode', value: this.isStrictMode()};
	}

	init() {
		super.init();
		addRoutes([createBodyServerApi(ApiDef_PermissionsAssert.vv1.assertUserPermissions, this.assertPermission)]);
		(_keys(this._keys) as string[]).forEach(key => this.permissionKeys[key] = new PermissionKey_BE(key));
		ModuleBE_SyncManager.setModuleFilter(async (dbModules: (ModuleBE_BaseDB<any>)[]) => {
			// return dbModules;
			//Filter out any module we don't have permission to sync
			const userPermissions = MemKey_UserPermissions.get();

			const mapDbNameToApiModules = arrayToMap(RuntimeModules()
				.filter<ModuleBE_BaseApi_Class<any>>((module: ApiModule) => !!module.apiDef && !!module.dbModule?.dbDef?.dbKey), item => item.dbModule.dbDef.dbKey);

			const paths = dbModules.map(module => {
				const mapDbNameToApiModule = mapDbNameToApiModules[module.dbDef.dbKey];
				if (!mapDbNameToApiModule) {
					// this.logWarning(`no module found for ${module.dbDef.dbKey}`);
					return undefined;
				}

				return mapDbNameToApiModule.apiDef?.['v1']?.['query'].path;
			});
			// this.logWarning(`Paths(${paths.length}):`, paths);
			const _allApis = await ModuleBE_PermissionAPIDB.query.where({});

			const apis = _allApis.filter(_api => paths.includes(_api.path));
			const mapPathToDBApi: TypedMap<DB_PermissionAPI> = arrayToMap(apis, api => api.path);

			return dbModules.filter((dbModule, index) => {
				const path = paths[index];
				if (!path) {
					// this.logWarningBold('no path');
					return false;
				}

				const dbApi = mapPathToDBApi[path];
				if (!dbApi) {
					// this.logWarningBold(`no dbApi ${path}`);
					return !ModuleBE_PermissionsAssert.isStrictMode();
				}

				const accessLevels = dbApi._accessLevels;
				return _keys(accessLevels!).reduce((hasAccess, domainId) => {
					if (!hasAccess)
						return false;

					const userDomainAccessValue = userPermissions[domainId];
					const apiRequiredAccessValue = accessLevels![domainId];
					if (!userDomainAccessValue)
						return false;

					if (!exists(userDomainAccessValue) || userDomainAccessValue < apiRequiredAccessValue) {
						this.logErrorBold(`${(userDomainAccessValue ?? 0)} < ${apiRequiredAccessValue} === ${(userDomainAccessValue ?? 0) < apiRequiredAccessValue}`);
						return false;
					}

					return hasAccess;
				}, true);
			});
		});
	}

	private assertPermission = async (body: Request_AssertApiForUser) => {
		await ModuleBE_PermissionsAssert.assertUserPermissions(body.projectId, body.path);
		return {userId: MemKey_AccountEmail.get()};
	};

	async assertUserPermissions(projectId: string, path: string) {
		// [DomainId]: accessLevel's numerical value
		const userPermissions = MemKey_UserPermissions.get();
		const apiDetails = await this.getApiDetails(path, projectId);

		this.logDebug('______________________________');
		this.logDebug(userPermissions);
		this.logDebug('______________________________');
		this.logDebug(apiDetails?.dbApi);
		this.logDebug('______________________________');

		if (!apiDetails || !apiDetails.dbApi.accessLevelIds) {
			if (!this.config.strictMode)
				return;

			throw new ApiException(403, `No permissions configuration specified for api: ${projectId ? `${projectId}--` : ''}${path}`);
		}

		//_accessLevels is a map[domain id <> access level numeric value]
		this.assertUserPassesAccessLevels(apiDetails.dbApi._accessLevels!, userPermissions);
	}

	public assertUserPassesAccessLevels(domainToLevelValueMap: DomainToLevelValueMap, userPermissions: TypedMap<number>) {
		_keys(domainToLevelValueMap).forEach(domainId => {
			const userDomainPermission = userPermissions[domainId];
			if (!exists(userDomainPermission))
				throw new ApiException(403, 'Missing Access For This Domain');

			if (userDomainPermission < domainToLevelValueMap[domainId]) {
				this.logErrorBold(`for domain - userAccessLevel <> expectedAccessLevel: "${domainId}" ${(userDomainPermission ?? 0)} <> ${domainToLevelValueMap[domainId]}`);
				throw new ApiException(403, 'Action Forbidden');
			}
		});
	}

	async getApiDetails(_path: string, projectId: string) {
		let path = _path.substring(0, (_path + '?').indexOf('?')); //Get raw path without query
		if (path.at(0) === '/')
			path = path.substring(1);

		this.logDebug(`Fetching Permission API for path: ${path} and project id: ${projectId}`);
		const dbApi = (await ModuleBE_PermissionAPIDB.query.custom({
			where: {
				path,
				projectId
			}
		}))[0];
		if (!dbApi)
			return undefined;

		const requestPermissions = await this.getAccessLevels(dbApi.accessLevelIds || []);

		return {
			dbApi,
			requestPermissions
		};
	}

	async getApisDetails(urls: string[], projectId: string) {
		const paths = urls.map(_path => _path.substring(0, (_path + '?').indexOf('?')));
		const apiDbs = await batchActionParallel(paths, 10, elements => ModuleBE_PermissionAPIDB.query.custom({
			where: {
				projectId,
				path: {$in: elements}
			}
		}));
		return Promise.all(paths.map(async path => {
			const apiDb = apiDbs.find(_apiDb => _apiDb.path === path);
			if (!apiDb)
				return;

			try {
				const requestPermissions = await this.getAccessLevels(apiDb.accessLevelIds);
				return ({
					apiDb,
					requestPermissions
				});
			} catch (e: any) {
				return;
			}
		}));
	}

	private async getAccessLevels(_accessLevelIds?: string[]): Promise<DB_PermissionAccessLevel[]> {
		const accessLevelIds = filterDuplicates(_accessLevelIds || []);
		const requestPermissions = filterInstances(await ModuleBE_PermissionAccessLevelDB.query.all(accessLevelIds));
		const idNotFound = accessLevelIds.find(lId => !requestPermissions.find(r => r._id === lId));
		if (idNotFound)
			throw new ApiException(404, `Could not find api level with _id: ${idNotFound}`);

		return requestPermissions;
	}

	setProjectId = (projectId: string) => {
		this.projectId = projectId;
	};

	getRegEx(value: string) {
		if (!value)
			return new RegExp(`^${value}$`, 'g');

		let regExValue = value;
		const startRegEx = '^';
		const endRegEx = '$';
		if (value[0] !== startRegEx)
			regExValue = startRegEx + regExValue;

		if (value[value.length - 1] !== endRegEx)
			regExValue = regExValue + endRegEx;

		return new RegExp(regExValue, 'g');
	}

	registerPermissionKeys(keys: string[]) {
		keys.forEach(key => {
			if (this._keys[key])
				throw new ImplementationMissingException(`Registered PermissionKey '${key}' more than once!`);

			this._keys[key] = true;
		});
	}

	private isStrictMode() {
		return !!this.config.strictMode;
	}
}

export const ModuleBE_PermissionsAssert = new ModuleBE_PermissionsAssert_Class();