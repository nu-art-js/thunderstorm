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

import {FirestoreTransaction} from '@nu-art/firebase/backend';
import {
	Const_UniqueKey,
	Const_UniqueKeys,
	Day,
	DB_Object,
	DB_Object_validator,
	DBDef,
	Default_UniqueKey,
	DefaultDBVersion,
	Dispatcher,
	Hour,
	keepDBObjectKeys,
	TS_Object,
	tsValidateResult,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {DB_EntityDependency} from '@nu-art/firebase';


export const Const_LockKeys: (keyof DB_Object)[] = [Const_UniqueKey, '_v', '__created', '__updated'];

export type DBApiBEConfig<DBType extends DB_Object, Ks extends keyof DBType = Default_UniqueKey> = {
	collectionName: string;
	validator: ValidatorTypeResolver<DBType>;
	uniqueKeys: Ks[]
	lockKeys: (keyof DBType)[]
	itemName: string;
	versions: string[];
	TTL: number;
	lastUpdatedTTL: number;
}

function getDbDefValidator<T extends DB_Object, Ks extends keyof T>(dbDef: DBDef<T, Ks>) {
	if (typeof dbDef.validator === 'function') {
		return [(instance: T) => tsValidateResult(keepDBObjectKeys(instance), DB_Object_validator), dbDef.validator];
	}
	return {...DB_Object_validator, ...dbDef.validator};
}

export const getModuleBEConfig = <T extends DB_Object, Ks extends keyof T = Default_UniqueKey>(dbDef: DBDef<T, Ks>): DBApiBEConfig<T, Ks> => {
	const dbDefValidator = getDbDefValidator(dbDef);
	return {
		collectionName: dbDef.dbName,
		validator: dbDefValidator as ValidatorTypeResolver<T>,
		uniqueKeys: dbDef.uniqueKeys || Const_UniqueKeys as Ks[],
		lockKeys: dbDef.lockKeys || dbDef.uniqueKeys || [...Const_LockKeys],
		itemName: dbDef.entityName,
		versions: dbDef.versions || [DefaultDBVersion],
		TTL: dbDef.TTL || Hour * 2,
		lastUpdatedTTL: dbDef.lastUpdatedTTL || Day
	};
};

export type CanDeleteDBEntities<AllTypes extends TS_Object, DeleteType extends string = string, ValidateType extends string = string> = {
	__canDeleteEntities: <T extends DeleteType>(type: T, items: (AllTypes[T])[], transaction?: FirestoreTransaction) => Promise<DB_EntityDependency<ValidateType>>
}

export const canDeleteDispatcher = new Dispatcher<CanDeleteDBEntities<any, any>, '__canDeleteEntities'>('__canDeleteEntities');