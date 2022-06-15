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

import {DBDef, tsValidateStringAndNumbersWithDashes} from '@nu-art/db-api-generator';
import {Minute, tsValidateAudit, tsValidateExists, tsValidateNumber, tsValidateRegexp, tsValidateTimestamp} from '@nu-art/ts-common';
import {DB_Asset} from './types';


export const validateName = tsValidateRegexp(/^.{3,}$/);

const Validator_Asset = {
	_id: tsValidateStringAndNumbersWithDashes,
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

export const DBDef_Assets: DBDef<DB_Asset> = {
	validator: Validator_Asset,
	dbName: 'assets',
	entityName: 'asset',
	relativeUrl: '/v1/assets',
};

export const Validator_TempAsset = {
	...Validator_Asset,
	timestamp: tsValidateTimestamp(Minute)
};

export const DBDef_TempAssets: DBDef<DB_Asset> = {
	validator: Validator_TempAsset,
	dbName: 'assets-temp',
	entityName: 'temp-asset',
	relativeUrl: '',
};