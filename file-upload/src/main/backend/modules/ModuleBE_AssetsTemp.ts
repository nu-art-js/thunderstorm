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
import {DBDef_TempAssets, DBProto_AssetsTemp} from '../..';
import {ModuleBE_BaseDBV3} from '@nu-art/thunderstorm/backend';


export class ModuleBE_AssetsTemp_Class
	extends ModuleBE_BaseDBV3<DBProto_AssetsTemp> {

	constructor() {
		super(DBDef_TempAssets);
	}
}

export const ModuleBE_AssetsTemp = new ModuleBE_AssetsTemp_Class();




