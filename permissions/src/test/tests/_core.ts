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
	DB_PermissionAccessLevel,
	DB_PermissionDomain,
	DB_PermissionProject,
	ModuleBE_PermissionAccessLevel,
	ModuleBE_PermissionApi,
	ModuleBE_PermissionDomain,
	ModuleBE_PermissionGroup,
	ModuleBE_PermissionProject,
	ModuleBE_PermissionUser
} from '../_main';
import {BaseDB_ApiGenerator} from '@nu-art/db-api-generator/backend';
import {__custom} from '@nu-art/testelot';


export type SetupLevel = { name: string, value: number }
export type SetupConfig = {
	project: { name: string, _id: string }
	domain: string
}
export type ConfigDB = {
	project: DB_PermissionProject
	domain: DB_PermissionDomain
	level?: DB_PermissionAccessLevel
}

export const AllPermissionsDBs = [
	ModuleBE_PermissionAccessLevel,
	ModuleBE_PermissionApi,
	ModuleBE_PermissionDomain,
	ModuleBE_PermissionProject,
	ModuleBE_PermissionUser,
	ModuleBE_PermissionGroup
];

const project1 = {name: 'Project One', _id: 'project-one'};
const project2 = {name: 'Project Two', _id: 'project-two'};
const project3 = {name: 'Project Three', _id: 'project-three'};

const domain1 = 'domain.name.one';
const domain2 = 'domain.name.two';
const domain3 = 'domain.name.three';

export const testLevel1 = {name: 'Level-One', value: 100, _id: '57a4b6c4db964fd0aa4dba593775ab53'};
export const testLevel2 = {name: 'Level-Two', value: 200, _id: '0eed1e3329d6492dbeff176ac2f67e0f'};
export const testLevel3 = {name: 'Level-Three', value: 300, _id: '846e1faa825740588b48eee82d0cfc9b'};

export const testConfig1: SetupConfig = {project: project1, domain: domain1};
export const testConfig2: SetupConfig = {project: project2, domain: domain2};
export const testConfig3: SetupConfig = {project: project3, domain: domain3};

export function setupDatabase(config: SetupConfig, _level?: SetupLevel) {
	return __custom(async () => {
		const project = await ModuleBE_PermissionProject.upsert(config.project);
		const domain = await ModuleBE_PermissionDomain.upsert({namespace: config.domain, projectId: config.project._id});
		let level;
		if (_level)
			level = await ModuleBE_PermissionAccessLevel.upsert({..._level, domainId: domain._id});

		const _config: ConfigDB = {project, domain, level};
		return _config;
	}).setLabel('Setup DB');
}

export function cleanup(collectionsToClean: BaseDB_ApiGenerator<any, any>[] = AllPermissionsDBs) {
	return __custom(async () => {
		for (const module of collectionsToClean) {
			// @ts-ignore
			await module.deleteCollection();
		}
	}).setLabel('Clean up');
}


