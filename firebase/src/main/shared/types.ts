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

import {
	RequireOptionals,
	MandatoryKeys
} from "@nu-art/ts-common";

export type Firebase_Message = {
	token?: string,
	topic?: string,
	condition?: string
};

export interface Firebase_Messaging {
	send(message: Firebase_Message, dryRun?: boolean): Promise<string>;
}


export type DB_Object = {
	_id: string
}

type Comparator = "in" | "array-contains" | "array-contains-any" | ">" | ">=" | "<" | "<=" | "==";
export type DB_RequestObject = Partial<DB_Object>

export type QueryComparator<T> =
	{ $ac: T extends (infer I)[] ? I : never } |
	{ $aca: T extends (infer I)[] ? I[] : never } |
	{ $in: T extends (infer I)[] ? never : T[] } |
	{ $gt: number } |
	{ $gte: number } |
	{ $lt: number } |
	{ $lte: number } |
	{ $eq: number };

export const ComparatorMap: { [k in keyof QueryComparator<any>]: Comparator } = {
	$in: "in",
	$ac: "array-contains",
	$aca: "array-contains-any",
	$gt: ">",
	$gte: ">=",
	$lt: "<",
	$lte: "<=",
	$eq: "==",
};
export type FilterKeys<T extends object> = MandatoryKeys<T, string | number>[];
export type FirestoreType_OrderByDirection = 'desc' | 'asc';
export type Clause_Where<T extends object> = { [P in keyof T]?: QueryComparator<T[P]> | T[P] | [T[P]] }
export type Clause_OrderBy<T extends object> = [{ key: keyof T, order: FirestoreType_OrderByDirection }];
export type Clause_Select<T extends object, K extends keyof T = keyof T> = K[];

export type FirestoreQuery<T extends object> = RequireOptionals<FirestoreQueryImpl<T>>
export type FirestoreQueryImpl<T extends object> = {
	select?: Clause_Select<T>
	orderBy?: Clause_OrderBy<T>
	where?: Clause_Where<T>
	limit?: number
}

export type EventType = 'value' | 'child_added' | 'child_changed' | 'child_moved' | 'child_removed';

export enum Firebase_EventType {
	Value        = "value",
	ChildAdded   = "child_added",
	ChildChanged = "child_changed",
	ChildMoved   = "child_moved",
	ChildRemoved = "child_removed"

}


export type FirebaseProjectCollections = { projectId: string, collections: string[] };
