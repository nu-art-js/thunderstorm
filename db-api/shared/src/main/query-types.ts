/*
 * Database API infrastructure library for Thunderstorm.
 *
 * Db-agnostic query types for CRUD API (structurally compatible with Firestore query wire format).
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

import {DB_Object} from './db-object.js';

/** Query comparator operators (same shape as Firestore for wire compatibility). */
export type CrudQueryComparator<T> =
	| { $ac: T extends (infer I)[] ? I : never }
	| { $aca: T extends (infer I)[] ? I[] : never }
	| { $nin: T extends (any)[] ? never : T[] }
	| { $in: T extends (any)[] ? never : T[] }
	| { $gt: number }
	| { $gte: number }
	| { $lt: number }
	| { $lte: number }
	| { $eq: number }
	| { $neq: T };

export type CrudOrderByDirection = 'desc' | 'asc';

export type CrudWhereValue<Value> =
	| CrudQueryComparator<Value>
	| (Value extends DB_Object ? CrudClause_Where<Value> : Value | [Value]);

export type CrudClause_Where<T extends DB_Object> = { [P in keyof T]?: CrudWhereValue<T[P]> };

export type CrudClause_OrderBy<T extends DB_Object> = [{ key: keyof T; order: CrudOrderByDirection }];

export type CrudClause_Select<T extends DB_Object, K extends keyof T = keyof T> = K[];

export type CrudQuery<T extends DB_Object> = {
	select?: CrudClause_Select<T>;
	orderBy?: CrudClause_OrderBy<T>;
	where?: CrudClause_Where<T>;
	withDeleted?: boolean;
	limit?: number | { page?: number; itemsCount: number };
};


/** Empty query constant (same shape as Firestore _EmptyQuery for wire compatibility). */
export const CrudEmptyQuery = Object.freeze({where: {}}) as CrudQuery<DB_Object>;
