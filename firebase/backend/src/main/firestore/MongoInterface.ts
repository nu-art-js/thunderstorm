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

import {FirestoreQuery, QueryComparator} from '@nu-art/firebase-shared';
import {__stringify, BadImplementationException, ImplementationMissingException, StaticLogger, TS_Object} from '@nu-art/ts-common';
import type {Document, Filter, Sort} from 'mongodb';


export type MqlCompiledQuery<T extends TS_Object = TS_Object> = {
	filter: Filter<T>;
	sort?: Sort;
	projection?: Document;
	skip?: number;
	limit?: number;
};

const MqlComparatorMap: Record<string, string> = {
	$nin: '$nin',
	$in: '$in',
	$ac: '$elemMatch',
	$aca: '$in',
	$gt: '$gt',
	$gte: '$gte',
	$lt: '$lt',
	$lte: '$lte',
	$eq: '$eq',
	$neq: '$ne',
};

export class MongoInterface {

	static buildQuery<T extends TS_Object>(query?: FirestoreQuery<T>): MqlCompiledQuery<T> {
		try {
			const result: MqlCompiledQuery<T> = {filter: {} as Filter<T>};

			if (query?.where)
				result.filter = this.buildFilter(query.where) as Filter<T>;

			if (query?.select)
				result.projection = this.buildProjection(query.select as string[]);

			if (query?.orderBy)
				result.sort = this.buildSort(query.orderBy);

			if (query?.limit !== undefined)
				Object.assign(result, this.buildPagination(query.limit));

			return result;
		} catch (e) {
			StaticLogger.logError(`Query: ${JSON.stringify(query)}`);
			StaticLogger.logError(`Error: ${e}`);
			throw e;
		}
	}

	private static buildFilter(where: Record<string, any>, prefix?: string): Document {
		const filter: Document = {};

		for (const field of Object.keys(where)) {
			const value = where[field];
			if (value === undefined || value === null)
				continue;

			if (field === '$or') {
				if (!Array.isArray(value) || value.length === 0)
					throw new BadImplementationException(`$or requires a non-empty array in filter: ${__stringify(where)}`);

				filter.$or = value.map((clause: Record<string, any>) => this.buildFilter(clause, prefix));
				continue;
			}

			const key = prefix ? `${prefix}.${field}` : field;

			if (Array.isArray(value)) {
				if (value.length === 0)
					throw new BadImplementationException(`Empty array in where clause for field '${key}'`);

				if (value.length === 1)
					filter[key] = value[0];
				else
					filter[key] = {$in: value};

				continue;
			}

			if (this.isQueryComparator(value)) {
				const comparatorKey = Object.keys(value)[0] as keyof QueryComparator<any>;
				const operand = value[comparatorKey];
				if (operand === undefined)
					throw new ImplementationMissingException(`No value for comparator ${comparatorKey} in filter: ${__stringify(where)}`);

				if (comparatorKey === '$regex') {
					if (!(operand instanceof RegExp))
						throw new BadImplementationException(`$regex requires a RegExp instance for field '${key}' in filter: ${__stringify(where)}`);

					const regexFilter: Document = {$regex: operand.source};
					if (operand.flags)
						regexFilter.$options = operand.flags;

					filter[key] = regexFilter;
					continue;
				}

				const mqlOp = MqlComparatorMap[comparatorKey as string];
				if (!mqlOp)
					throw new ImplementationMissingException(`No MQL comparator for: ${comparatorKey} in filter: ${__stringify(where)}`);

				if (comparatorKey === '$ac') {
					filter[key] = operand;
				} else {
					filter[key] = {[mqlOp]: operand};
				}
				continue;
			}

			const valueType = typeof value;
			if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
				filter[key] = value;
				continue;
			}

			if (valueType === 'object') {
				Object.assign(filter, this.buildFilter(value, key));
				continue;
			}

			throw new ImplementationMissingException(`Cannot compile where clause for '${key}' with value type '${valueType}' in filter: ${__stringify(where)}`);
		}

		return filter;
	}

	private static isQueryComparator(value: any): boolean {
		if (typeof value !== 'object' || Array.isArray(value))
			return false;

		const keys = Object.keys(value);
		return keys.length === 1 && (
			value['$ac'] !== undefined ||
			value['$aca'] !== undefined ||
			value['$in'] !== undefined ||
			value['$nin'] !== undefined ||
			value['$gt'] !== undefined ||
			value['$gte'] !== undefined ||
			value['$lt'] !== undefined ||
			value['$lte'] !== undefined ||
			value['$neq'] !== undefined ||
			value['$eq'] !== undefined ||
			value['$regex'] !== undefined);
	}

	private static buildProjection(select: string[]): Document {
		const projection: Document = {};
		for (const field of select)
			projection[field] = 1;

		return projection;
	}

	private static buildSort(orderBy: Array<{ key: string | number | symbol, order: 'asc' | 'desc' }>): Sort {
		const sort: Record<string, 1 | -1> = {};
		for (const entry of orderBy)
			sort[entry.key as string] = entry.order === 'asc' ? 1 : -1;

		return sort;
	}

	private static buildPagination(limit: number | { page?: number, itemsCount: number }): { skip?: number; limit?: number } {
		if (typeof limit === 'number')
			return {limit};

		const page = limit.page || 0;
		const result: { skip?: number; limit: number } = {limit: limit.itemsCount};
		if (page > 0)
			result.skip = limit.itemsCount * page;

		return result;
	}
}
