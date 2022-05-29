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

import {ComparatorMap, FirestoreQuery} from '../..';
import {FirestoreType_DocumentSnapshot, FirestoreType_Query} from './types';
import {FirestoreCollection} from './FirestoreCollection';
import {__stringify, _keys, BadImplementationException, ImplementationMissingException, TS_Object} from '@nu-art/ts-common';
import {Query} from 'firebase-admin/firestore';


export class FirestoreInterface {

	static buildQuery<Type extends TS_Object>(collection: FirestoreCollection<Type>, query?: FirestoreQuery<Type>) {
		try {
			let myQuery: FirestoreType_Query = collection.collection;
			if (query && query.select)
				myQuery = myQuery.select ? myQuery.select(...query.select as string[]) : myQuery;

			if (query && query.where) {
				const whereClause = query.where;
				myQuery = Object.keys(whereClause).reduce((_query: FirestoreType_Query, _whereField) => {
					const whereField = _whereField;
					const whereValue: any = whereClause[whereField as keyof Type];
					if (whereValue === undefined || whereValue === null)
						return _query;

					const processObject = (___query: FirestoreType_Query, whereKey: string, _whereValue: any): FirestoreType_Query => {
						const valueType = typeof _whereValue;

						if (Array.isArray(_whereValue)) {
							if (_whereValue.length === 0 || _whereValue.length > 10)
								throw new BadImplementationException(
									'While querying in an array you can only provide one or more values to query by and not more than 10... this ' +
									'is due to Firestore limitation... ');

							if (_whereValue.length === 1)
								return _query.where(whereKey, 'array-contains', _whereValue[0]);

							return _query.where(whereKey, 'array-contains-any', _whereValue);
						}

						if (this.isQueryObject(_whereValue)) {
							// @ts-ignore
							const comparator = ComparatorMap[Object.keys(_whereValue)[0]];
							const value = Object.values(_whereValue)[0];
							if (!comparator || !value)
								console.log(`query: ${JSON.stringify(query)}`);

							if (!comparator)
								throw new ImplementationMissingException(`could not find comparator for: ${Object.keys(_whereValue)[0]}`);

							if (!value)
								throw new ImplementationMissingException(`value: ${Object.keys(_whereValue)[0]}`);
							return _query.where(whereKey, comparator, value);
						}

						if (valueType === 'string' || valueType === 'number' || valueType === 'boolean')
							return ___query.where(whereKey, '==', _whereValue);

						if (valueType === 'object') {
							return Object.keys(_whereValue as object).reduce((__query: FirestoreType_Query, key) => {
								return processObject(__query, `${whereKey}.${key}`, _whereValue[key]);
							}, ___query);
						}

						throw new ImplementationMissingException(
							`Could not compose where clause for '${whereKey}' with value type '${valueType}'in query: ${__stringify(___query)}`);
					};

					return processObject(_query, whereField, whereValue);
				}, myQuery);
			}

			if (query && query.orderBy)
				myQuery = query.orderBy.reduce((_query: FirestoreType_Query, field) => {
					return _query.orderBy ? _query.orderBy(field.key as string, field.order) : _query;
				}, myQuery);

			if (query && query.limit)
				if (typeof query.limit === 'number')
					myQuery = myQuery.limit(query.limit);
				else {
					const page = query.limit.page || 0;

					// console.log(`limit: ${query.limit.itemsCount} * ${page}`);
					if (page > 0)
						myQuery = myQuery.offset(query.limit.itemsCount * page + 1);

					myQuery = myQuery.limit(query.limit.itemsCount);
				}

			return myQuery as Query;
		} catch (e) {
			console.log(e);
			console.log(JSON.stringify(query));
			throw e;
		}
	}

	private static isQueryObject(whereValue: any) {
		return typeof whereValue === 'object' && Object.keys(whereValue).length === 1 && (
			whereValue['$ac'] ||
			whereValue['$aca'] ||
			whereValue['$in'] ||
			whereValue['$nin'] ||
			whereValue['$gt'] ||
			whereValue['$gte'] ||
			whereValue['$lt'] ||
			whereValue['$lte'] ||
			whereValue['$neq'] ||
			whereValue['$eq']);
	}

	static assertUniqueDocument(results: FirestoreType_DocumentSnapshot[], query: FirestoreQuery<any>, collectionName: string): (FirestoreType_DocumentSnapshot | undefined) {
		if (results.length > 1)
			throw new BadImplementationException(`too many results for query: ${__stringify(query)} in collection: ${collectionName}`);

		if (results.length === 0)
			return;

		return results[0];
	}

	static buildUniqueQuery<Type extends TS_Object>(collection: FirestoreCollection<Type>, instance: Type): FirestoreQuery<Type> {
		_keys(instance).forEach((key) => {
			if (instance[key] === undefined || instance[key] === null) {
				throw new BadImplementationException(
					`No where properties are allowed to be null or undefined.\nWhile querying collection '${collection.name}' we found property '${key as string}' to be '${instance[key]}'`);
			}
		});

		const where = collection.externalUniqueFilter(instance);
		return {where};
	}
}