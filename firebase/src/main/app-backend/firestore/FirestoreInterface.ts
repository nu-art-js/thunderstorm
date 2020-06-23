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
	ComparatorMap,
	FirestoreQuery
} from "../..";
import {
	FirestoreType_DocumentSnapshot,
	FirestoreType_Query
} from "./types";
import {FirestoreCollection} from "./FirestoreCollection";
import {
	__stringify,
	_keys,
	BadImplementationException
} from "@nu-art/ts-common";
import * as admin from "firebase-admin";

export class FirestoreInterface {
	static buildQuery<Type extends object>(collection: FirestoreCollection<Type>, query?: FirestoreQuery<Type>): admin.firestore.Query {
		let myQuery: FirestoreType_Query = collection.collection;
		if (query && query.select)
			myQuery = myQuery.select ? myQuery.select(...query.select as string[]) : myQuery;

		if (query && query.where) {
			const whereClause = query.where;
			myQuery = _keys(whereClause).reduce((_query: FirestoreType_Query, whereField) => {
				const whereValue = whereClause[whereField];
				if (whereValue === undefined || whereValue === null)
					return _query;

				const valueType = typeof whereValue;
				if (valueType === "string" || valueType === "number" || valueType === "boolean")
					return _query.where(whereField as string, "==", whereValue);

				if (Array.isArray(whereValue)) {
					if (whereValue.length === 0 || whereValue.length > 10)
						throw new BadImplementationException(
							"While querying in an array you can only provide one or more values to query by and not more than 10... this " +
							"is due to Firestore limitation... ");

					if (whereValue.length === 1)
						return _query.where(whereField as string, 'array-contains', whereValue[0]);

					return _query.where(whereField as string, 'array-contains-any', whereValue);
				}

				const keys = _keys(whereValue as {});
				if (keys.length !== 1)
					throw new BadImplementationException("query comparator must have only one comparator");

				// @ts-ignore
				return _query.where(whereField, ComparatorMap[keys[0]], Object.values(whereValue)[0]);
			}, myQuery);
		}

		if (query && query.orderBy)
			myQuery = query.orderBy.reduce((_query: FirestoreType_Query, field) => {
				return _query.orderBy ? _query.orderBy(field.key as string, field.order) : _query;
			}, myQuery);

		if (query && query.limit)
			myQuery = myQuery.limit(query.limit);

		return myQuery as admin.firestore.Query;
	}

	static assertUniqueDocument(results: FirestoreType_DocumentSnapshot[], query: FirestoreQuery<any>): (FirestoreType_DocumentSnapshot | undefined) {
		if (results.length > 1)
			throw new BadImplementationException(`too many results for query: ${__stringify(query)} in collection: ${this.name}`);

		if (results.length === 0)
			return;

		return results[0];
	};

	static buildUniqueQuery<Type extends object>(collection: FirestoreCollection<Type>, instance: Type): FirestoreQuery<Type> {
		_keys(instance).forEach((key) => {
			if (instance[key] === undefined || instance[key] === null) {
				throw new BadImplementationException(
					`No where properties are allowed to be null or undefined.\nWhile querying collection '${collection.name}' we found property '${key}' to be '${instance[key]}'`)
			}
		});

		const where = collection.externalUniqueFilter(instance);
		return {where};
	}
}