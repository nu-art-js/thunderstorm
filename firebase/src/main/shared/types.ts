/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

import {MandatoryKeys, RequireOptionals, TS_Object, UniqueId} from '@nu-art/ts-common';
import {ResponseError} from '@nu-art/ts-common/core/exceptions/types';


/**
 * Test test
 * token: pah
 */
export type Firebase_Message = {
	token?: string,
	topic?: string,
	condition?: string
};

export interface Firebase_Messaging {
	send(message: Firebase_Message, dryRun?: boolean): Promise<string>;
}

export type FirebaseConfig = {
	id: string,
	projectId: string;
	apiKey: string,
	authDomain: string,
	databaseURL?: string,
	storageBucket?: string,
	messagingSenderId: string
	local?: boolean
}

type Comparator = 'in' | 'array-contains' | 'array-contains-any' | '>' | '>=' | '<' | '<=' | '==';

export type QueryComparator<T> =
	{ $ac: T extends (infer I)[] ? I : never } |
	{ $aca: T extends (infer I)[] ? I[] : never } |
	{ $nin: T extends (any)[] ? never : T[] } |
	{ $in: T extends (any)[] ? never : T[] } |
	{ $gt: number } |
	{ $gte: number } |
	{ $lt: number } |
	{ $lte: number } |
	{ $eq: number } |
	{ $neq: T };

export const ComparatorMap: { [k in keyof QueryComparator<any>]: Comparator } = {
	$nin: 'not-in',
	$in: 'in',
	$ac: 'array-contains',
	$aca: 'array-contains-any',
	$gt: '>',
	$gte: '>=',
	$lt: '<',
	$lte: '<=',
	$eq: '==',
	$neq: '!=',
};

export type FilterKeys<T extends TS_Object> = MandatoryKeys<T, string | number>[];
export type FirestoreType_OrderByDirection = 'desc' | 'asc';
export type WhereValue<Value> =
	QueryComparator<Value>
	| (Value extends TS_Object ? Clause_Where<Value> : Value | [Value]);
export type Clause_Where<T extends TS_Object> = { [P in keyof T]?: WhereValue<T[P]> }
export type Clause_OrderBy<T extends TS_Object> = [{ key: keyof T, order: FirestoreType_OrderByDirection }];
export type Clause_Select<T extends TS_Object, K extends keyof T = keyof T> = K[];

export type FirestoreQuery<T extends TS_Object> = RequireOptionals<FirestoreQueryImpl<T>>
export type FirestoreQueryImpl<T extends TS_Object> = {
	select?: Clause_Select<T>
	orderBy?: Clause_OrderBy<T>
	where?: Clause_Where<T>
	withDeleted?: boolean
	limit?: number | { page?: number, itemsCount: number }
}

export type FirebaseProjectCollections = { projectId: string, collections: string[] };

/**
 * Only for MemKey_DeletedDocs
 */
export type PotentialDependenciesToDelete<Type extends string = string> = { dbKey: Type, ids: string[] };

export type DB_EntityDependency<Type extends string = string> = {
	collectionKey: Type,
	conflictingIds: string[]
};

// New dependency conflict
export type EntityRef = { dbKey: string, id: UniqueId }; //dbKey of target to delete, id of target to delete
export type EntityRefs = { dbKey: string, ids: UniqueId[] }; //dbKey of conflicting collection, ids of conflicting items in collection

export type Conflict = { target: EntityRef, conflicts: EntityRefs }

export type DB_EntityDependencyV2 = {
	originalItemsToDelete: EntityRef[] // trying to delete variables a, b and c
	issues: Conflict[] // an array of variables a, b and c and each with their conflicts, or empty conflicts array for items that don't have conflicts between items that do
};
//fin New dependency conflict

export type EntityDependencyError = ResponseError<'has-dependencies', DB_EntityDependencyV2[]>;

export type MultiWriteOperation = 'create' | 'set' | 'update' | 'delete';