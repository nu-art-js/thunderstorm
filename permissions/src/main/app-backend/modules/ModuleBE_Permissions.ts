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

import {BadImplementationException, DB_BaseObject, ImplementationMissingException, Module, PreDB, StringMap} from '@nu-art/ts-common';
import {ModuleBE_PermissionsAssert} from './ModuleBE_PermissionsAssert';
import {ApiDefServer, ApiModule, ApiResponse, createBodyServerApi, createQueryServerApi, ExpressRequest, ServerApi, Storm} from '@nu-art/thunderstorm/backend';
import {ModuleBE_PermissionGroup, ModuleBE_PermissionUser} from './assignment';
import {ModuleBE_PermissionApi, ModuleBE_PermissionProject} from './management';
import {
	ApiDef_Permissions,
	ApiStruct_Permissions,
	DB_PermissionProject,
	PredefinedGroup,
	PredefinedUser,
	Request_RegisterProject,
	Request_UserCFsByShareGroups,
	Request_UsersCFsByShareGroups,
	Request_UserUrlsPermissions,
	Response_UsersCFsByShareGroups,
	UserUrlsPermissions
} from '../shared';
import {Middleware_ValidateSession, ModuleBE_Account} from '@nu-art/user-account/backend';
import {UI_Account} from '@nu-art/user-account';
import {AssertSecretMiddleware} from '@nu-art/thunderstorm/app-backend/modules/proxy/assert-secret-middleware';


type Config = {
	project: PreDB<DB_PermissionProject> & DB_BaseObject
	predefinedGroups?: PredefinedGroup[],
	predefinedUser?: PredefinedUser
}

class ServerApi_UserCFsByShareGroups
	extends ServerApi<ApiStruct_Permissions['v1']['getUserCFsByShareGroups']> {

	constructor() {
		super(ApiDef_Permissions.v1.getUserCFsByShareGroups);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: never, body: Request_UserCFsByShareGroups) {
		const account = await ModuleBE_Account.validateSession({}, request);
		return ModuleBE_Permissions.getUserCFsByShareGroups(account._id, body.groupsIds);
	}
}

// class ServerApi_RegisterExternalProject
// 	extends ServerApi<ApiStruct_Permissions['v1']['registerExternalProject']> {
//
// 	constructor() {
// 		super(ApiDef_Permissions.v1.registerExternalProject);
// 	}
//
// 	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: never, body: Request_RegisterProject) {
// 		RemoteProxy.assertSecret(request);
// 		await ModuleBE_Permissions._registerProject(body);
// 	}
// }

export class ModuleBE_Permissions_Class
	extends Module<Config>
	implements ApiDefServer<ApiStruct_Permissions>, ApiModule {
	readonly v1: ApiDefServer<ApiStruct_Permissions>['v1'];

	constructor() {
		super();
		this.v1 = {
			getUserUrlsPermissions: createBodyServerApi(ApiDef_Permissions.v1.getUserUrlsPermissions, this.getUserUrlsPermissions, Middleware_ValidateSession),
			getUserCFsByShareGroups: new ServerApi_UserCFsByShareGroups(),
			getUsersCFsByShareGroups: createBodyServerApi(ApiDef_Permissions.v1.getUsersCFsByShareGroups, this.getUsersCFsByShareGroups, Middleware_ValidateSession),
			// registerExternalProject: new ServerApi_RegisterExternalProject(),
			registerExternalProject: createBodyServerApi(ApiDef_Permissions.v1.registerExternalProject, this._registerProject, AssertSecretMiddleware),
			registerProject: createQueryServerApi(ApiDef_Permissions.v1.registerProject, this.registerProject),
		};
	}

	useRoutes() {
		return this.v1;
	}

	protected init(): void {
		if (!this.config)
			throw new ImplementationMissingException('MUST set config with project identity!!');
	}

	getProjectIdentity = () => this.config.project;

	async getUserUrlsPermissions(body: Request_UserUrlsPermissions, middleware: [UI_Account]) {
		const account = middleware[0];

		const projectId: string = body.projectId;
		const urlsMap: UserUrlsPermissions = body.urls;
		const userId: string = account._id;
		const requestCustomField: StringMap = body.requestCustomField;

		const urls = Object.keys(urlsMap);
		const [userDetails, apiDetails] = await Promise.all(
			[
				ModuleBE_PermissionsAssert.getUserDetails(userId),
				ModuleBE_PermissionsAssert.getApisDetails(urls, projectId)
			]
		);

		return urls.reduce((userUrlsPermissions: UserUrlsPermissions, url, i) => {
			const apiDetail = apiDetails[i];
			if (apiDetail) {
				try {
					ModuleBE_PermissionsAssert._assertUserPermissionsImpl(apiDetail, projectId, userDetails, requestCustomField);
					userUrlsPermissions[url] = true;
				} catch (e: any) {
					userUrlsPermissions[url] = false;
				}
			} else
				userUrlsPermissions[url] = false;

			return userUrlsPermissions;
		}, {});
	}

	async getUsersCFsByShareGroups(body: Request_UsersCFsByShareGroups): Promise<Response_UsersCFsByShareGroups> {
		const usersEmails = body.usersEmails;
		const groupsIds = body.groupsIds;
		const toRet: Response_UsersCFsByShareGroups = {};
		await Promise.all(usersEmails.map(async email => {
			const account = await ModuleBE_Account.getUser(email);
			if (!account)
				return;

			toRet[email] = await this.getUserCFsByShareGroups(account._id, groupsIds);
		}));

		return toRet;
	}

	async getUserCFsByShareGroups(userId: string, groupsIds: string[]): Promise<StringMap[]> {
		const user = await ModuleBE_PermissionUser.queryUnique({accountId: userId});
		const userCFs: StringMap[] = [];
		if (!user.groups)
			return userCFs;

		user.groups.forEach(userGroup => {
			if (!groupsIds.find(groupId => groupId === userGroup.groupId))
				return;

			if (!userGroup.customField)
				return;

			userCFs.push(userGroup.customField);
		});

		return userCFs;
	}

	async registerProject() {
		const routes: string[] = Storm.getInstance().getRoutes().reduce((carry: string[], httpRoute) => {
			if (httpRoute.path !== '*')
				carry.push(httpRoute.path);

			return carry;
		}, []);

		const projectRoutes = {
			project: ModuleBE_Permissions.getProjectIdentity(),
			routes,
			predefinedGroups: this.config.predefinedGroups,
			predefinedUser: this.config.predefinedUser
		};

		return this._registerProject(projectRoutes);
	}

	async _registerProject(registerProject: Request_RegisterProject) {
		const project = registerProject.project;
		await ModuleBE_PermissionProject.upsert(project);
		const id = project._id;
		if (!id)
			throw new BadImplementationException('register project is missing an id');

		await ModuleBE_PermissionApi.registerApis(id, registerProject.routes);
		const predefinedGroups = registerProject.predefinedGroups;
		if (!predefinedGroups || predefinedGroups.length === 0)
			return;

		await ModuleBE_PermissionGroup.upsertPredefinedGroups(id, project.name, predefinedGroups);

		const predefinedUser = registerProject.predefinedUser;
		if (!predefinedUser)
			return;

		const groupsUser = predefinedUser.groups.map(groupItem => {
			const customField: StringMap = {};
			const allRegEx = '.*';
			if (!groupItem.customKeys || !groupItem.customKeys.length)
				customField['_id'] = allRegEx;
			else {
				groupItem.customKeys.forEach((customKey) => {
					customField[customKey] = allRegEx;
				});
			}

			return {
				groupId: ModuleBE_PermissionGroup.getPredefinedGroupId(id, groupItem._id),
				customField
			};
		});
		await ModuleBE_PermissionUser.upsert({...predefinedUser, groups: groupsUser});
	}
}

export const ModuleBE_Permissions = new ModuleBE_Permissions_Class();