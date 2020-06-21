/*
 * ts-common is the basic building blocks of our typescript projects
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
	Module,
	StringMap,
	_keys,
	BadImplementationException
} from "@nu-art/ts-common";
import {
	ApiException,
	ServerApi,
	HttpRequestData,
	ExpressRequest,
	ServerApi_Middleware
} from "@nu-art/thunderstorm/backend";
import {
	Base_AccessLevels,
	DB_PermissionAccessLevel,
	DB_PermissionsGroup
} from "../..";
import {
	AccessLevelPermissionsDB,
	ApiPermissionsDB
} from "./db-types/managment";
import {
	GroupPermissionsDB,
	UserPermissionsDB
} from "./db-types/assign";
import {HttpMethod} from "@nu-art/thunderstorm";
import {AccountModule} from "@nu-art/user-account/backend";
import {PermissionsModule} from "./PermissionsModule";

export type UserCalculatedAccessLevel = { [domainId: string]: number };
export type GroupPairWithBaseLevelsObj = { accessLevels: Base_AccessLevels[], customFields: StringMap[] };
export type RequestPairWithLevelsObj = { accessLevels: DB_PermissionAccessLevel[], customField: StringMap };


export class PermissionsAssert_Class
	extends Module {

	readonly Middleware = (keys: string[]): ServerApi_Middleware => async (req: ExpressRequest, data: HttpRequestData) => {
		await this.CustomMiddleware(keys, async (projectId: string, customFields: StringMap) => {

			const userId = await AccountModule.validateSession(req);
			return this.assertUserPermissions(projectId, data.url, userId, customFields);
		})(req, data);
	};

	readonly CustomMiddleware = (keys: string[], action: (projectId: string, customFields: StringMap) => Promise<void>): ServerApi_Middleware => async (req: ExpressRequest, data: HttpRequestData) => {
		const customFields: StringMap = {};
		let object: { [k: string]: any };
		switch (data.method) {
			case HttpMethod.POST:
			case HttpMethod.PATCH:
			case HttpMethod.PUT:
				object = data.body;
				break;

			case HttpMethod.GET:
			case HttpMethod.DELETE:
				object = data.query;
				break;

			default:
				throw new BadImplementationException(`Generic custom fields cannot be extracted on api with method: ${data.method}`)
		}

		_keys(object).filter(key => keys.includes(key as string)).forEach(key => {
			const oElement = object[key];
			if (oElement === undefined || oElement === null)
				return;

			if (typeof oElement !== "string")
				return;

			customFields[key] = oElement;
		});

		const projectId = PermissionsModule.getProjectIdentity()._id;
		await action(projectId, customFields);
	};

	async assertUserPermissions(projectId: string, _path: string, userId: string, requestCustomField: StringMap) {
		const path = _path.substring(0, (_path + '?').indexOf('?'));
		const [apiDetails, userDetails] = await Promise.all([this.getApiDetails(path, projectId), this.getUserDetails(userId)]);

		if (!apiDetails.apiDb.accessLevelIds) {
			if (ServerApi.isDebug)
				return;

			throw new ApiException(403, `No permissions configuration specified for api: ${projectId}--${path}`);
		}

		const groups = userDetails.userGroups;
		const requestPermissions = apiDetails.requestPermissions;

		const requestPairWithLevelsObj: RequestPairWithLevelsObj = {accessLevels: requestPermissions, customField: requestCustomField};

		let groupMatch = false;
		const groupsMatchArray = groups.map(group => {
			const groupPairWithLevelsObj: GroupPairWithBaseLevelsObj = {accessLevels: group.__accessLevels || [], customFields: group.customFields || []};

			return this.isMatchWithLevelsObj(groupPairWithLevelsObj, requestPairWithLevelsObj);
		});

		for (const match of groupsMatchArray) {
			if (match)
				groupMatch = true;
		}

		if (!groupMatch) {
			throw new ApiException(403, "Action Forbidden");
		}
	}

	private async getUserDetails(uuid: string) {
		const user = await UserPermissionsDB.queryUnique({userId: uuid});
		const groups = user.groups || [];
		const groupIds = groups.map(userGroup => userGroup.groupId);
		const groupsArray: DB_PermissionsGroup[][] = await Promise.all(
			this.splitToManyArrays(groupIds || []).map(subGroupIds => GroupPermissionsDB.query({where: {_id: {$in: subGroupIds}}})));
		const userGroups: DB_PermissionsGroup[] = ([] as DB_PermissionsGroup[]).concat(...groupsArray);

		userGroups.map(userGroup => {
			const group = groups.find(groupItem => groupItem.groupId === userGroup._id);
			if (!group)
				throw new BadImplementationException("You are missing group in your code implementation");

			const cfArray = [];
			if (userGroup.customFields) {
				cfArray.push(...userGroup.customFields);
			}

			if (group.customField) {
				cfArray.push(group.customField);
			}
		});

		return {
			user,
			userGroups
		}
	}

	private async getApiDetails(path: string, projectId: string) {
		const apiDb = await ApiPermissionsDB.queryUnique({path, projectId});
		const requestPermissions = await this.getAccessLevels(apiDb.accessLevelIds || []);

		return {
			apiDb,
			requestPermissions
		}
	}

	private async getAccessLevels(accessLevelIds: string[]) {
		return Promise.all(accessLevelIds.map((levelId: string) => AccessLevelPermissionsDB.queryUnique({_id: levelId})));
	}

	private splitToManyArrays(arrayIds: string[]) {
		const bulkSize = 10;
		const bulksNumber = Math.ceil(arrayIds.length / bulkSize);
		const containArray = [];
		for (let i = 0; i < bulksNumber; i++) {
			const startIndex = i * bulkSize;
			const subArrayIds = arrayIds.slice(startIndex, startIndex + bulkSize);
			containArray.push(subArrayIds);
		}

		return containArray;
	}

	isMatchWithLevelsObj(groupPair: GroupPairWithBaseLevelsObj, requestPair: RequestPairWithLevelsObj) {
		let match = true;
		if (!this.doesCustomFieldsSatisfies(groupPair.customFields, requestPair.customField)) {
			return false;
		}

		const groupDomainLevelMap = this.getDomainLevelMap(groupPair.accessLevels);
		requestPair.accessLevels.forEach((requiredLevel, index) => {
			const userAccessLevel = groupDomainLevelMap[requiredLevel.domainId];
			if (userAccessLevel === undefined || userAccessLevel < requiredLevel.value)
				match = false;
		});

		return match;
	}

	private getDomainLevelMap(accessLevels: Base_AccessLevels[]) {
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

		return groupCustomFields.reduce((doesSatisfies, customField) => {
			return doesSatisfies || this.doesCustomFieldSatisfies(customField, requestCustomField);
		}, false);
	}

	private doesCustomFieldSatisfies(groupCustomField: StringMap, requestCustomField: StringMap) {
		return Object.keys(requestCustomField).reduce((doesSatisfies, requestCustomFieldKey) => {
			const customFieldRegEx = this.getRegEx(groupCustomField[requestCustomFieldKey]);
			return doesSatisfies && customFieldRegEx.test(requestCustomField[requestCustomFieldKey]);
		}, true as boolean);
	}

	private getRegEx(value: string) {
		if (!value)
			return new RegExp(`^${value}$`, "g");

		let regExValue = value;
		const startRegEx = '^';
		const endRegEx = '$';
		if (value[0] !== startRegEx)
			regExValue = startRegEx + regExValue;

		if (value[value.length - 1] !== endRegEx)
			regExValue = regExValue + endRegEx;

		return new RegExp(regExValue, "g");
	}
}

export const PermissionsAssert = new PermissionsAssert_Class();