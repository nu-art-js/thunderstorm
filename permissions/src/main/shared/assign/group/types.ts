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

import {Auditable, DB_Object, StringMap} from '@nu-art/ts-common';


export type Base_AccessLevels = {
	domainId: string,
	value: number
}

export type Request_CreateGroup = {
	label: string,
	tags?: string[],
	accessLevelIds?: string[],
	__accessLevels?: Base_AccessLevels[],
	customFields?: StringMap[]
};

export type DB_PermissionGroup = DB_Object & Request_CreateGroup & Auditable;