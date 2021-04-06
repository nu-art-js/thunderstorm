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
import {ServerApi} from "@nu-art/thunderstorm/backend";
import {AssetsModule_Class} from "./AssetsModule";
import {DB_Asset} from "../..";
import {
	Minute,
	tsValidateTimestamp,
	TypeValidator
} from "@nu-art/ts-common";


export class AssetsTempModule_Class
	extends AssetsModule_Class {
	static __validator: TypeValidator<DB_Asset> = {
		...AssetsModule_Class._validator,
		timestamp: tsValidateTimestamp(Minute),
	};

	constructor() {
		super('assets-temp', AssetsTempModule_Class.__validator);
	}

	apis(pathPart?: string): ServerApi<any>[] {
		return [];
	}
}

export const AssetsTempModule = new AssetsTempModule_Class();




