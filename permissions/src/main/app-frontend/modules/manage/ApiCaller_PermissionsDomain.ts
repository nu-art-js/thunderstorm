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

import {ApiCallerEventType, BaseDB_ApiGeneratorCaller, getModuleFEConfig} from '@nu-art/db-api-generator/frontend';
import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {DB_PermissionDomain, DBDef_PermissionDomain} from '../../shared';


export interface OnPermissionsDomainsLoaded {
	__onPermissionsDomainsLoaded: (...params: ApiCallerEventType) => void;
}

const dispatch_onPermissionsDomainsLoaded = new ThunderDispatcher<OnPermissionsDomainsLoaded, '__onPermissionsDomainsLoaded'>('__onPermissionsDomainsLoaded');

export class PermissionsDomainModule_Class
	extends BaseDB_ApiGeneratorCaller<DB_PermissionDomain> {

	constructor() {
		super(getModuleFEConfig(DBDef_PermissionDomain));
		this.setDefaultDispatcher(dispatch_onPermissionsDomainsLoaded);
	}

	protected init(): void {
	}

	getDomains(projectId: string): DB_PermissionDomain[] {
		return this.getItems().filter(domain => domain.projectId === projectId);
	}
}

export const ApiCaller_PermissionsDomain = new PermissionsDomainModule_Class();
