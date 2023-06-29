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

import {ApiCallerEventTypeV2, ModuleFE_BaseApi} from '@nu-art/db-api-generator/frontend';
import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {DB_PermissionApi, DBDef_PermissionApi} from '../../shared';


export interface OnPermissionsApisLoaded {
	__onPermissionsApisLoaded: (...params: ApiCallerEventTypeV2<DB_PermissionApi>) => void;
}

const dispatch_onPermissionsApisLoaded = new ThunderDispatcher<OnPermissionsApisLoaded, '__onPermissionsApisLoaded'>('__onPermissionsApisLoaded');

export class ModuleFE_PermissionsApi_Class
	extends ModuleFE_BaseApi<DB_PermissionApi> {

	constructor() {
		super(DBDef_PermissionApi, dispatch_onPermissionsApisLoaded);
	}

	protected init(): void {
	}

}

export const ModuleFE_PermissionsApi = new ModuleFE_PermissionsApi_Class();
