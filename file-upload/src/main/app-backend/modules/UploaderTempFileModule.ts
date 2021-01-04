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
	auditValidator,
	TypeValidator,
	validateExists,
	validateRegexp
} from "@ir/ts-common";
import {ServerApi} from "@ir/thunderstorm/backend"
import {
	BaseDB_ApiGenerator,
	validateUniqueId
} from "@ir/db-api-generator/backend";
import {DB_Temp_File} from "../../shared/types";

export const TEMP_COLLECTION = 'temp-files-upload';

export const validateName = validateRegexp(/^.{3,}$/);

export class UploaderTempFileModule_Class
	extends BaseDB_ApiGenerator<DB_Temp_File> {
	static _validator: TypeValidator<DB_Temp_File> = {
		_id: validateUniqueId,
		name: validateName,
		feId: validateExists(true),
		mimeType: validateExists(true),
		key: validateExists(true),
		path: validateExists(true),
		_audit: auditValidator(),
		bucketName: validateExists(true)
	};

	constructor() {
		super(TEMP_COLLECTION, UploaderTempFileModule_Class._validator, 'temp-files')
	}

	apis(pathPart?: string): ServerApi<any>[] {
		return [];
	}
}

export const UploaderTempFileModule = new UploaderTempFileModule_Class();




