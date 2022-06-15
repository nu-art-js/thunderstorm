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

import { DBDef } from "..";
import {DB_Object, ValidatorTypeResolver} from '@nu-art/ts-common';
import { BaseDB_ApiGenerator } from "./BaseDB_ApiGenerator";

export type DBApiBEConfig<DBType extends DB_Object, Ks extends keyof DBType = '_id'> = {
	collectionName: string;
	validator: ValidatorTypeResolver<DBType>;
	itemName: string;
	versions: string[];
}

export const getModuleBEConfig = <T extends DB_Object>(dbDef: DBDef<T>): DBApiBEConfig<T> => {
	return {
		collectionName: dbDef.dbName,
		validator: {
			...dbDef.validator,
			...BaseDB_ApiGenerator.__validator,
		} as ValidatorTypeResolver<T>,
		itemName: dbDef.entityName,
		versions: dbDef.versions || ['1.0.0'],
	}
}