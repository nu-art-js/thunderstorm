/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {DB_PermissionAccessLevel} from "../../../index";
import {BaseDB_ApiGeneratorCaller} from "@ir/db-api-generator/frontend";
import {ThunderDispatcher} from "@ir/thunderstorm/frontend";


export interface OnPermissionsLevelsLoaded {
	__onPermissionsLevelsLoaded: () => void;
}

const dispatch_onPermissionsLevelsLoaded = new ThunderDispatcher<OnPermissionsLevelsLoaded, "__onPermissionsLevelsLoaded">("__onPermissionsLevelsLoaded");

export class PermissionsAccessLevelModule_Class
	extends BaseDB_ApiGeneratorCaller<DB_PermissionAccessLevel> {
	private levels: { [k: string]: DB_PermissionAccessLevel[] } = {};

	constructor() {
		super({key: "level", relativeUrl: "/v1/permissions/manage/level"});
	}

	protected init(): void {
	}

	protected async onEntryCreated(response: DB_PermissionAccessLevel): Promise<void> {
		this.query();
	}

	protected async onEntryDeleted(response: DB_PermissionAccessLevel): Promise<void> {
		this.query();
	}

	protected async onEntryUpdated(response: DB_PermissionAccessLevel): Promise<void> {
		this.query();
	}

	protected async onGotUnique(response: DB_PermissionAccessLevel): Promise<void> {
	}

	protected async onQueryReturned(response: DB_PermissionAccessLevel[]): Promise<void> {
		this.levels = {};
		response.forEach(level => {
			const levelArray = this.levels[level.domainId] || [];
			levelArray.push(level);
			this.levels[level.domainId] = levelArray
		});

		dispatch_onPermissionsLevelsLoaded.dispatchUI([]);
	}

	getLevels(domainId: string): DB_PermissionAccessLevel[] {
		return this.levels[domainId] || [];
	}

	getAllLevels(): DB_PermissionAccessLevel[] {
		let allLevelsArray: DB_PermissionAccessLevel[] = [];
		for (const key of Object.keys(this.levels)) {
			allLevelsArray = allLevelsArray.concat(this.levels[key]);
		}

		return allLevelsArray;
	}

}

export const ApiCaller_PermissionsAccessLevel = new PermissionsAccessLevelModule_Class();
