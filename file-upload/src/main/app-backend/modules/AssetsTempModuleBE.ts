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
import {ServerApi} from '@nu-art/thunderstorm/backend';
import {DB_Asset} from '../..';
import {Minute, tsValidateAudit, tsValidateExists, tsValidateNumber, tsValidateRegexp, tsValidateTimestamp, TypeValidator} from '@nu-art/ts-common';
import {ApisParams, BaseDB_ApiGenerator} from '@nu-art/db-api-generator/backend';

export const validateName = tsValidateRegexp(/^.{3,}$/);

export const _assetValidator: TypeValidator<DB_Asset> = {
	...BaseDB_ApiGenerator.__validator,
	timestamp: tsValidateNumber(),
	name: validateName,
	ext: tsValidateExists(true),
	md5Hash: tsValidateExists(false),
	feId: tsValidateExists(true),
	mimeType: tsValidateExists(true),
	key: tsValidateExists(true),
	path: tsValidateExists(true),
	_audit: tsValidateAudit(),
	bucketName: tsValidateExists(true),
	public: undefined
};

export class AssetsTempModuleBE_Class
	extends BaseDB_ApiGenerator<DB_Asset> {

	static __validator: TypeValidator<DB_Asset> = {
		..._assetValidator,
		timestamp: tsValidateTimestamp(Minute),
	};

	constructor() {
		super('assets-temp', AssetsTempModuleBE_Class.__validator, 'assets-temp');
	}

	_apis(options?: ApisParams): (ServerApi<any> | undefined)[] {

		return [];
	}
}

export const AssetsTempModuleBE = new AssetsTempModuleBE_Class();




