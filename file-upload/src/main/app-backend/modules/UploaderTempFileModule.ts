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
	tsValidateAudit,
	TypeValidator,
	tsValidateExists,
	tsValidateRegexp
} from "@nu-art/ts-common";
import {ServerApi} from "@nu-art/thunderstorm/backend"
import {
	BaseDB_ApiGenerator,
	tsValidateUniqueId
} from "@nu-art/db-api-generator/backend";
import {DB_Temp_File} from "../../shared/types";

export const TEMP_COLLECTION = 'temp-files-upload';

export const validateName = tsValidateRegexp(/^.{3,}$/);

export class UploaderTempFileModule_Class
	extends BaseDB_ApiGenerator<DB_Temp_File> {
	static _validator: TypeValidator<DB_Temp_File> = {
		_id: tsValidateUniqueId,
		name: validateName,
		feId: tsValidateExists(true),
		mimeType: tsValidateExists(true),
		key: tsValidateExists(true),
		path: tsValidateExists(true),
		_audit: tsValidateAudit(),
		bucketName: tsValidateExists(true),
		public: undefined
	};

	constructor() {
		super(TEMP_COLLECTION, UploaderTempFileModule_Class._validator, 'temp-files')
	}

	apis(pathPart?: string): ServerApi<any>[] {
		return [];
	}
}

export const UploaderTempFileModule = new UploaderTempFileModule_Class();




