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
	__stringify,
	_values,
	ApiException,
	DB_BaseObject,
	DBProto,
	Metadata,
	Module
} from '@nu-art/ts-common';
import {ModuleBE_BaseDBV3} from './ModuleBE_BaseDBV3';
import {_EmptyQuery, FirestoreQuery} from '@nu-art/firebase';
import {DBApiDefGeneratorIDBV3} from '../../../shared';
import {addRoutes} from '../ModuleBE_APIs';
import {createBodyServerApi, createQueryServerApi} from '../../core/typed-api';


/**
 * A base class used for implementing CRUD operations on a db module collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export class ModuleBE_BaseApiV3_Class<Proto extends DBProto<any>>
	extends Module {

	readonly dbModule: ModuleBE_BaseDBV3<Proto>;
	readonly apiDef;

	constructor(dbModule: ModuleBE_BaseDBV3<Proto, any>, version?: string) {
		super(`Gen(${dbModule.getName()}, Api)`);
		this.dbModule = dbModule;
		this.apiDef = DBApiDefGeneratorIDBV3<Proto>(this.dbModule.dbDef, version);
	}

	init() {
		this.logWarning(`Adding routes : ${this.apiDef.v1.query.path}`);
		addRoutes([
			createBodyServerApi(this.apiDef.v1.query, this.dbModule.query.custom),
			createBodyServerApi(this.apiDef.v1.sync, this.dbModule.querySync),
			createQueryServerApi(this.apiDef.v1.queryUnique, async (queryObject: DB_BaseObject) => {
				const toReturnItem = await this.dbModule.query.unique(queryObject._id);
				if (!toReturnItem)
					throw new ApiException(404, `Could not find ${this.dbModule.collection.dbDef.entityName} with _id: ${queryObject._id}`);
				return toReturnItem;
			}),
			createBodyServerApi(this.apiDef.v1.upsert, this.dbModule.set.item),
			createBodyServerApi(this.apiDef.v1.upsertAll, (body) => this.dbModule.set.all(body)),
			createQueryServerApi(this.apiDef.v1.delete, (toDeleteObject: DB_BaseObject) => this.dbModule.delete.unique(toDeleteObject._id)),
			createBodyServerApi(this.apiDef.v1.deleteQuery, this._deleteQuery),
			createQueryServerApi(this.apiDef.v1.deleteAll, () => this.dbModule.delete.query(_EmptyQuery)),
			createQueryServerApi(this.apiDef.v1.metadata, this._metadata)
		]);
	}

	private _metadata = async (): Promise<Metadata<Proto['dbType']>> => {
		return {...this.dbModule.dbDef.metadata} as unknown as Metadata<Proto['dbType']> || `not implemented yet for collection '${this.dbModule.dbDef.dbName}'`;
	};

	private _deleteQuery = async (query: FirestoreQuery<Proto['dbType']>): Promise<Proto['dbType'][]> => {
		if (!query.where)
			throw new ApiException(400, `Cannot delete without a where clause, using query: ${__stringify(query)}`);

		if (_values(query.where).filter(v => v === undefined || v === null).length > 0)
			throw new ApiException(400, `Cannot delete with property value undefined or null, using query: ${__stringify(query)}`);

		return this.dbModule.delete.query(query);
	};
}

export const createApisForDBModuleV3 = <Proto extends DBProto<any>>(dbModule: ModuleBE_BaseDBV3<Proto>, version?: string) => {
	return new ModuleBE_BaseApiV3_Class<Proto>(dbModule, version);
};
