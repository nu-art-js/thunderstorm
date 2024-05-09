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
import {DBDef_TempDeleted, DBProto_AssetsDeleted} from '../..';
import {ModuleBE_BaseDB} from '@nu-art/thunderstorm/backend';


export class ModuleBE_AssetsDeleted_Class
	extends ModuleBE_BaseDB<DBProto_AssetsDeleted> {

	constructor() {
		super(DBDef_TempDeleted);
	}
}

export const ModuleBE_AssetsDeleted = new ModuleBE_AssetsDeleted_Class();




