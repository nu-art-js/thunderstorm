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

import {
	DB_PermissionDomain
} from "../../../index";
import {BaseDB_ApiGeneratorCaller} from "@ir/db-api-generator/frontend";
import {ThunderDispatcher} from "@ir/thunderstorm/frontend";

export interface OnPermissionsDomainsLoaded {
	__onPermissionsDomainsLoaded: () => void;
}

const dispatch_onPermissionsDomainsLoaded = new ThunderDispatcher<OnPermissionsDomainsLoaded, "__onPermissionsDomainsLoaded">("__onPermissionsDomainsLoaded");

export class PermissionsDomainModule_Class
	extends BaseDB_ApiGeneratorCaller<DB_PermissionDomain> {
	private domains: { [k: string]: DB_PermissionDomain[] } = {};

	constructor() {
		super({key: "domain", relativeUrl: "/v1/permissions/manage/domain"});
	}

	protected init(): void {
	}

	protected async onEntryCreated(response: DB_PermissionDomain): Promise<void> {
		this.query();
	}

	protected async onEntryDeleted(response: DB_PermissionDomain): Promise<void> {
		this.query();
	}

	protected async onEntryUpdated(response: DB_PermissionDomain): Promise<void> {
		this.query();
	}

	protected async onGotUnique(response: DB_PermissionDomain): Promise<void> {
	}

	protected async onQueryReturned(response: DB_PermissionDomain[]): Promise<void> {
		this.domains = {};
		response.forEach(domain => {
			const domainArray = this.domains[domain.projectId] || [];
			domainArray.push(domain);
			this.domains[domain.projectId] = domainArray
		});

		dispatch_onPermissionsDomainsLoaded.dispatchUI([]);
	}

	getDomains(projectId: string): DB_PermissionDomain[] {
		return this.domains[projectId] || [];
	}

	getAllDomains(): DB_PermissionDomain[] {
		let allDomainsArray: DB_PermissionDomain[] = [];
		for (const key of Object.keys(this.domains)) {
			allDomainsArray = allDomainsArray.concat(this.domains[key]);
		}

		return allDomainsArray;
	}

}

export const ApiCaller_PermissionsDomain = new PermissionsDomainModule_Class();
