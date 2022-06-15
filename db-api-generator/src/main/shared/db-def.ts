/*
 * Database API Generator is a utility library for Thunderstorm.
 *
 * Given proper configurations it will dynamically generate APIs to your Firestore
 * collections, will assert uniqueness and restrict deletion... and more
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

import {DB_Object, OmitDBObject, ValidatorTypeResolver} from '@nu-art/ts-common';

/**
 * @field version - First item in the array is current version, Must pass all past versions with the current, default version is 1.0.0
 */
export type DBDef<T extends DB_Object> = {
	validator: ValidatorTypeResolver<OmitDBObject<T>>;
	dbName: string;
	entityName: string;
	versions?: string[];
	relativeUrl: string;
}