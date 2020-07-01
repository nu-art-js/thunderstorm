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
	ImplementationMissingException,
	Module,
	StringMap
} from "@nu-art/ts-common";
import {
	DB_PermissionProject,
	PredefinedGroup,
	Request_RegisterProject,
	UserUrlsPermissions
} from "./_imports";
import {PermissionsAssert} from "./permissions-assert";
import {
	ApiPermissionsDB,
	ProjectPermissionsDB
} from "./db-types/managment";
import {HttpServer} from "@nu-art/thunderstorm/backend";
import {GroupPermissionsDB} from "./db-types/assign";

type Config = {
	project: DB_PermissionProject
	predefinedGroups?: PredefinedGroup[]
}

export class PermissionsModule_Class
	extends Module<Config> {

	constructor() {
		super();
	}

	protected init(): void {
		if (!this.config)
			throw new ImplementationMissingException("MUST set config with project identity!!");
	}

	getProjectIdentity = () => this.config.project;

	async getUserUrlsPermissions(projectId: string, urls: UserUrlsPermissions, userId: string, requestCustomField: StringMap) {
		const userUrlsPermissions: UserUrlsPermissions = {};
		const userUrlsPermissionsArray = await Promise.all(Object.keys(urls).map(url => this.isUserHasPermissions(projectId, url, userId, requestCustomField)));
		userUrlsPermissionsArray.forEach(urlPermission => {
			userUrlsPermissions[urlPermission.url] = urlPermission.isAllowed;
		});

		return userUrlsPermissions;
	}

	private async isUserHasPermissions(projectId: string, url: string, userId: string, requestCustomField: StringMap) {
		let isAllowed;

		try {
			await PermissionsAssert.assertUserPermissions(projectId, url, userId, requestCustomField);
			isAllowed = true;
		} catch (e) {
			isAllowed = false;
		}

		return {url, isAllowed}
	}

	async registerProject() {
		const serverRoutes = HttpServer.getRoutes();

		let routes: string[] = serverRoutes.map((httpRoute: { path: string; }) => httpRoute.path);
		routes = routes.filter(path => path !== '*');

		const projectIdentity = PermissionsModule.getProjectIdentity();
		const projectRoutes = {
			project: projectIdentity,
			routes: routes,
			predefinedGroups: this.config.predefinedGroups
		};

		return this._registerProject(projectRoutes)
	}

	async _registerProject(registerProject: Request_RegisterProject) {
		const project = registerProject.project;
		await ProjectPermissionsDB.upsert(project);
		await ApiPermissionsDB.registerApis(project._id, registerProject.routes);
		const predefinedGroups = registerProject.predefinedGroups;
		if (!predefinedGroups || predefinedGroups.length === 0)
			return;

		return GroupPermissionsDB.upsertPredefinedGroups(project._id, project.name, predefinedGroups);
	}
}

export const PermissionsModule = new PermissionsModule_Class();