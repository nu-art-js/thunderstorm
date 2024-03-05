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

import {
	Const_UniqueKey,
	DB_Object,
	DBDef,
	Default_UniqueKey,
	DefaultDBVersion,
	KeysOfDB_Object,
	tsValidateOptional,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {DBConfig} from '../IndexedDB';


export type DBApiFEConfig<DBType extends DB_Object, Ks extends keyof DBType = Default_UniqueKey> = {
	key: string
	versions: string[]
	validator: ValidatorTypeResolver<DBType>
	dbConfig: DBConfig<DBType, Ks>
}

export const getModuleFEConfig = <T extends DB_Object, Ks extends keyof T = Default_UniqueKey>(dbDef: DBDef<T, Ks>): DBApiFEConfig<T, Ks> => {
	//FE validator ignores any props that are defined in dbdef.generatedProps
	const validator = ([...dbDef.generatedProps || [], ...KeysOfDB_Object] as (keyof T)[]).reduce((_validator, prop) => {
		{ // @ts-ignore
			_validator[prop] = tsValidateOptional;
		}
		return _validator;
	}, dbDef.validator as ValidatorTypeResolver<T>);

	return {
		key: dbDef.dbKey,
		versions: dbDef.versions || [DefaultDBVersion],
		validator: validator,
		dbConfig: {
			version: 1,
			name: dbDef.dbKey,
			indices: dbDef.indices,
			autoIncrement: false,
			uniqueKeys: dbDef.uniqueKeys || [Const_UniqueKey] as Ks[]
		},
	};
};