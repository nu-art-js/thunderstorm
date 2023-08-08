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
	BadImplementationException,
	batchActionParallel,
	filterDuplicates,
	Module,
	StringMap,
	TypedMap
} from '@nu-art/ts-common';
import {addRoutes, createBodyServerApi, ServerApi_Middleware} from '@nu-art/thunderstorm/backend';
import {HttpMethod} from '@nu-art/thunderstorm';
import {MemKey_AccountEmail, MemKey_AccountId} from '@nu-art/user-account/backend';
import {
	ApiDef_PermissionsAssert,
	Base_AccessLevel,
	DB_PermissionAccessLevel,
	DB_PermissionApi,
	DB_PermissionGroup,
	DB_PermissionUser,
	Request_AssertApiForUser,
	User_Group
} from '../../shared';
import {ModuleBE_PermissionUserDB} from './assignment/ModuleBE_PermissionUserDB';
import {ModuleBE_PermissionGroup} from './assignment/ModuleBE_PermissionGroup';
import {ModuleBE_PermissionApi} from './management/ModuleBE_PermissionApi';
import {ModuleBE_PermissionAccessLevel} from './management/ModuleBE_PermissionAccessLevel';
import {
	MemKey_HttpRequestBody,
	MemKey_HttpRequestMethod,
	MemKey_HttpRequestQuery,
	MemKey_HttpRequestUrl
} from '@nu-art/thunderstorm/backend/modules/server/consts';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';


export type UserCalculatedAccessLevel = { [domainId: string]: number };
export type GroupPairWithBaseLevelsObj = { accessLevels: Base_AccessLevel[] };
export type RequestPairWithLevelsObj = { accessLevels: DB_PermissionAccessLevel[] };

type Config = {
	strictMode?: boolean
}
export const MemKey_UserPermissions = new MemKey<TypedMap<number>>('user-permissions');

export class ModuleBE_PermissionsAssert_Class
	extends Module<Config> {

	private projectId!: string;

	readonly Middleware = (keys: string[] = []): ServerApi_Middleware => async () => {
		await this.CustomMiddleware(keys, async (projectId: string) => {

			return this.assertUserPermissions(projectId, MemKey_HttpRequestUrl.get());
		})();
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

	constructor() {
		super();
	}

	init() {
		super.init();
		addRoutes([createBodyServerApi(ApiDef_PermissionsAssert.v1.assertUserPermissions, this.assertPermission)]);
	}

	private assertPermission = async (body: Request_AssertApiForUser) => {
		await ModuleBE_PermissionsAssert.assertUserPermissions(body.projectId, body.path);
		return {userId: MemKey_AccountEmail.get()};
	};

	async assertUserPermissions(projectId: string, path: string) {
		const [apiDetails, userDetails] = await Promise.all(
			[
				this.getApiDetails(path, projectId),
				this.getUserDetails()
			]);

		this._assertUserPermissionsImpl(apiDetails, projectId, userDetails);
	}

	_assertUserPermissionsImpl(apiDetails: {
								   dbApi: DB_PermissionApi;
								   requestPermissions: DB_PermissionAccessLevel[]
							   },
							   projectId: string,
							   userDetails: {
								   user: DB_PermissionUser,
								   userGroups: DB_PermissionGroup[]
							   }) {
		if (!apiDetails.dbApi.accessLevelIds) {
			if (!this.config.strictMode)
				return;

			throw new ApiException(403, `No permissions configuration specified for api: ${projectId}--${apiDetails.dbApi.path}`);
		}

		this.assertUserPermissionsImpl(userDetails.userGroups, apiDetails.requestPermissions);
	}

	async assertUserSharingGroup(granterUserId: string, userGroup: User_Group) {
		const [granterUser, groupToShare] = await Promise.all([this.getUserDetails(), ModuleBE_PermissionGroup.query.uniqueAssert(userGroup.groupId)]);
		const requestPermissions = await this.getAccessLevels(groupToShare.accessLevelIds || []);
		this.assertUserPermissionsImpl(granterUser.userGroups, requestPermissions);
	}

	assertUserPermissionsImpl(userGroups: DB_PermissionGroup[], requestPermissions: DB_PermissionAccessLevel[]) {
		if (!requestPermissions.length)
			return;

		const requestPairWithLevelsObj: RequestPairWithLevelsObj = {
			accessLevels: requestPermissions,
		};

		let groupMatch = false;
		const groupsMatchArray = userGroups.map(group => {
			const groupPairWithLevelsObj: GroupPairWithBaseLevelsObj = {
				accessLevels: group.__accessLevels || [],
			};

			return this.isMatchWithLevelsObj(groupPairWithLevelsObj, requestPairWithLevelsObj);
		});

		for (const match of groupsMatchArray) {
			if (match)
				groupMatch = true;
		}

		if (!groupMatch) {
			throw new ApiException(403, 'Action Forbidden');
		}
	}

	async getUserDetails(): Promise<{
		user: DB_PermissionUser,
		userGroups: DB_PermissionGroup[]
	}> {
		const user = await ModuleBE_PermissionUserDB.query.uniqueCustom({where: {accountId: MemKey_AccountId.get()}});
		const userGroups = user.groups || [];
		const groups: DB_PermissionGroup[] = await batchActionParallel(userGroups.map(userGroup => userGroup.groupId), 10, subGroupIds => ModuleBE_PermissionGroup.query.custom({where: {_id: {$in: subGroupIds}}}));

		return {
			user,
			userGroups: this.getCombineUserGroups(userGroups, groups)
		};
	}

	private getCombineUserGroups(userGroups: User_Group[], groups: DB_PermissionGroup[]) {
		const combinedGroups: DB_PermissionGroup[] = [];
		groups.forEach(group => {
			const existUserGroupItem = userGroups.find(groupItem => groupItem.groupId === group._id);
			if (!existUserGroupItem)
				throw new BadImplementationException('You are missing group in your code implementation');

			userGroups.forEach((userGroup) => {
				if (userGroup.groupId === group._id) {
					combinedGroups.push({...group});
				}
			});
		});

		return combinedGroups;
	}

	async getApiDetails(_path: string, projectId: string) {
		const path = _path.substring(0, (_path + '?').indexOf('?'));
		const dbApi = await ModuleBE_PermissionApi.query.uniqueWhere({path, projectId});
		const requestPermissions = await this.getAccessLevels(dbApi.accessLevelIds || []);

		return {
			dbApi,
			requestPermissions
		};
	}

	async getApisDetails(urls: string[], projectId: string) {
		const paths = urls.map(_path => _path.substring(0, (_path + '?').indexOf('?')));
		const apiDbs = await batchActionParallel(paths, 10, elements => ModuleBE_PermissionApi.query.custom({
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
		const requestPermissions = await batchActionParallel(accessLevelIds, 10, elements => ModuleBE_PermissionAccessLevel.query.custom({where: {_id: {$in: elements}}}));
		const idNotFound = accessLevelIds.find(lId => !requestPermissions.find(r => r._id === lId));
		if (idNotFound)
			throw new ApiException(404, `Could not find api level with _id: ${idNotFound}`);

		return requestPermissions;
	}

	setProjectId = (projectId: string) => {
		this.projectId = projectId;
	};

	isMatchWithLevelsObj(groupPair: GroupPairWithBaseLevelsObj, requestPair: RequestPairWithLevelsObj) {
		let match = true;

		if (!match)
			return false;

		const groupDomainLevelMap = this.getDomainLevelMap(groupPair.accessLevels);
		requestPair.accessLevels.forEach((requiredLevel, index) => {
			const userAccessLevel = groupDomainLevelMap[requiredLevel.domainId];
			if (userAccessLevel === undefined || userAccessLevel < requiredLevel.value)
				match = false;
		});

		return match;
	}

	private getDomainLevelMap(accessLevels: Base_AccessLevel[]) {
		return accessLevels.reduce((toRet, accessLevel) => {
			const levelForDomain = toRet[accessLevel.domainId];
			if (!levelForDomain || levelForDomain < accessLevel.value)
				toRet[accessLevel.domainId] = accessLevel.value;

			return toRet;
		}, {} as UserCalculatedAccessLevel);
	}

	doesCustomFieldsSatisfies(groupCustomFields: StringMap[] = [], requestCustomField: StringMap) {
		if (!Object.keys(requestCustomField).length)
			return true;

		for (const customField of groupCustomFields) {
			if (this.doesCustomFieldSatisfies(customField, requestCustomField))
				return true;
		}

		return false;
	}

	private doesCustomFieldSatisfies(groupCustomField: StringMap, requestCustomField: StringMap) {
		return Object.keys(requestCustomField).reduce((doesSatisfies, requestCustomFieldKey) => {
			const customFieldRegEx = this.getRegEx(groupCustomField[requestCustomFieldKey]);
			return doesSatisfies && customFieldRegEx.test(requestCustomField[requestCustomFieldKey]);
		}, true as boolean);
	}

	private getRegEx(value: string) {
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
}

export const ModuleBE_PermissionsAssert = new ModuleBE_PermissionsAssert_Class();