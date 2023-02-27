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

import {DB_ApiGenerator} from '@nu-art/db-api-generator/backend';
import {ApiDefServer, ApiModule, createBodyServerApi, ExpressRequest, ServerApi} from '@nu-art/thunderstorm/backend';
import {ApiDef_PermissionUser, ApiStruct_PermissionsUser, DB_PermissionUser, Request_AssignAppPermissions} from '../../shared';
import {ModuleBE_PermissionUserDB} from './ModuleBE_PermissionUserDB';


export class ModuleBE_PermissionUserAPI_Class
	extends DB_ApiGenerator<DB_PermissionUser>
	implements ApiDefServer<ApiStruct_PermissionsUser>, ApiModule {

	readonly pah: ApiDefServer<ApiStruct_PermissionsUser>['pah'];

	constructor() {
		super(ModuleBE_PermissionUserDB);
		this.pah = {
			assignAppPermissions: createBodyServerApi(ApiDef_PermissionUser.pah.assignAppPermissions, this.assignAppPermissions),
		};
	}

	useRoutes() {
		return [...super.useRoutes(), this.pah.assignAppPermissions] as ServerApi<any>[];
	}

	async assignAppPermissions(body: Request_AssignAppPermissions, request?: ExpressRequest) {
		return ModuleBE_PermissionUserDB.assignAppPermissions(body);
	}
}

export const ModuleBE_PermissionUserAPI = new ModuleBE_PermissionUserAPI_Class();
