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

import {DBConfig} from '@nu-art/thunderstorm/frontend';
import {DB_Object} from '@nu-art/ts-common';
import {Const_UniqueKey, DBDef, Default_UniqueKey, DefaultDBVersion} from '..';


export type DBApiFEConfig<DBType extends DB_Object, Ks extends keyof DBType = Default_UniqueKey> = {
	key: string
	versions: string[]
	dbConfig: DBConfig<DBType, Ks>
}

export const getModuleFEConfig = <T extends DB_Object, Ks extends keyof T = Default_UniqueKey>(dbDef: DBDef<T, Ks>): DBApiFEConfig<T, Ks> => {
	return {
		key: dbDef.dbName,
		versions: dbDef.versions || [DefaultDBVersion],
		dbConfig: {
			version: 1,
			name: dbDef.dbName,
			indices: dbDef.indices,
			autoIncrement: false,
			uniqueKeys: dbDef.uniqueKeys || [Const_UniqueKey] as Ks[]
		},
	};
};