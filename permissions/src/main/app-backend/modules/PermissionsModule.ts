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
import {PermissionsAssert} from './permissions-assert';
import {HttpServer} from '@nu-art/thunderstorm/backend';
import {AccountModuleBE} from '@nu-art/user-account/app-backend/modules/AccountModuleBE';
import {ModuleBE_PermissionGroup, ModuleBE_PermissionUser} from './assignment';
import {ModuleBE_PermissionApi, ModuleBE_PermissionProject} from './management';
import {DB_PermissionProject, PredefinedGroup, PredefinedUser, Request_RegisterProject, Response_UsersCFsByShareGroups, UserUrlsPermissions} from '../shared';


type Config = {
	project: PreDB<DB_PermissionProject> & DB_BaseObject
	predefinedGroups?: PredefinedGroup[],
	predefinedUser?: PredefinedUser
}

export class PermissionsModule_Class
	extends Module<Config> {

	constructor() {
		super();
	}

	protected init(): void {
		if (!this.config)
			throw new ImplementationMissingException('MUST set config with project identity!!');
	}

	getProjectIdentity = () => this.config.project;

	async getUserUrlsPermissions(projectId: string, urlsMap: UserUrlsPermissions, userId: string, requestCustomField: StringMap) {
		const urls = Object.keys(urlsMap);
		const [userDetails, apiDetails] = await Promise.all(
			[
				PermissionsAssert.getUserDetails(userId),
				PermissionsAssert.getApisDetails(urls, projectId)
			]
		);

		return urls.reduce((userUrlsPermissions: UserUrlsPermissions, url, i) => {
			const apiDetail = apiDetails[i];
			if (apiDetail) {
				try {
					PermissionsAssert._assertUserPermissionsImpl(apiDetail, projectId, userDetails, requestCustomField);
					userUrlsPermissions[url] = true;
				} catch (e: any) {
					userUrlsPermissions[url] = false;
				}
			} else
				userUrlsPermissions[url] = false;

			return userUrlsPermissions;
		}, {});
	}

	async getUsersCFsByShareGroups(usersEmails: string[], groupsIds: string[]): Promise<Response_UsersCFsByShareGroups> {
		const toRet: Response_UsersCFsByShareGroups = {};
		await Promise.all(usersEmails.map(async email => {
			const account = await AccountModuleBE.getUser(email);
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
		const routes: string[] = HttpServer.getRoutes().reduce((carry: string[], httpRoute) => {
			if (httpRoute.path !== '*')
				carry.push(httpRoute.path);

			return carry;
		}, []);

		const projectRoutes = {
			project: PermissionsModule.getProjectIdentity(),
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

export const PermissionsModule = new PermissionsModule_Class();