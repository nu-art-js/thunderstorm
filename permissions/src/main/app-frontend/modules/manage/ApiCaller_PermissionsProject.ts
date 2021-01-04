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

import {DB_PermissionProject} from "../../../index";
import {BaseDB_ApiGeneratorCaller} from "@ir/db-api-generator/frontend";
import {ThunderDispatcher} from "@ir/thunderstorm/frontend";

export interface OnPermissionsProjectsLoaded {
	__onPermissionsProjectsLoaded: () => void;
}


const dispatch_onPermissionsProjectsLoaded = new ThunderDispatcher<OnPermissionsProjectsLoaded, '__onPermissionsProjectsLoaded'>(
	'__onPermissionsProjectsLoaded');

export class PermissionsProjectModule_Class
	extends BaseDB_ApiGeneratorCaller<DB_PermissionProject> {
	private projects: DB_PermissionProject[] = [];
	private projectsCustomKeys: string[] = [];


	constructor() {
		super({key: "project", relativeUrl: "/v1/permissions/manage/project"});
	}

	protected init(): void {
	}

	protected async onEntryCreated(response: DB_PermissionProject): Promise<void> {
		this.query();
	}

	protected async onEntryDeleted(response: DB_PermissionProject): Promise<void> {
		this.query();
	}

	protected async onEntryUpdated(response: DB_PermissionProject): Promise<void> {
		this.query();
	}

	protected async onGotUnique(response: DB_PermissionProject): Promise<void> {
	}

	protected async onQueryReturned(response: DB_PermissionProject[]): Promise<void> {
		this.projects = response;
		this.projectsCustomKeys = response.reduce((toRet, project) => {
			return toRet.concat(project.customKeys || []);
		}, [] as string[]);

		dispatch_onPermissionsProjectsLoaded.dispatchUI([]);
	}

	fetchProjects() {
		this.query();
		return this.projects;
	}

	getProjectsCustomKeys() {
		return this.projectsCustomKeys || [];
	}

	getProjects(): DB_PermissionProject[] {
		return this.projects || [];
	}

}

export const ApiCaller_PermissionsProject = new PermissionsProjectModule_Class();
