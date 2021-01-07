/*
 * Permissions management system, define access level for each of 
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Intuition Robotics
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
	ApiTypeBinder,
	BaseHttpRequest,
	DeriveBodyType,
	DeriveQueryType,
	DeriveResponseType,
	DeriveUrlType,
	ErrorResponse,
	QueryParams,
	RequestErrorHandler
} from "@intuitionrobotics/thunderstorm";
import {
	ApiBinder_DBCreate,
	ApiBinder_DBDelete,
	ApiBinder_DBQuery,
	ApiBinder_DBUniuqe,
	DefaultApiDefs,
	GenericApiDef
} from "../index";
import {DB_Object} from "@intuitionrobotics/firebase";
import {
	ToastModule,
	XhrHttpModule
} from "@intuitionrobotics/thunderstorm/frontend";

import {
	Module,
	PartialProperties
} from "@intuitionrobotics/ts-common";

export type BaseApiConfig = {
	relativeUrl: string
	key: string
}

export abstract class BaseDB_ApiGeneratorCaller<DBType extends DB_Object, UType extends PartialProperties<DBType, "_id"> = PartialProperties<DBType, "_id">>
	extends Module<BaseApiConfig> {

	private readonly errorHandler: RequestErrorHandler<any> = (request: BaseHttpRequest<any>, resError?: ErrorResponse<any>) => {
		if (this.onError(request, resError))
			return;
		return ToastModule.toastError(request.getStatus() === 403 ? "You are not allowed to perform this action. Please check your permissions." : "Failed to perform action.");
	};

	constructor(config: BaseApiConfig) {
		super();
		this.setDefaultConfig(config);
	}

	private createRequest<Binder extends ApiTypeBinder<U, R, B, P, any> = ApiTypeBinder<void, void, void, {}, any>,
		U extends string = DeriveUrlType<Binder>,
		R = DeriveResponseType<Binder>,
		B = DeriveBodyType<Binder>,
		P extends QueryParams = DeriveQueryType<Binder>>(apiDef: GenericApiDef) {
		return XhrHttpModule
			.createRequest<ApiTypeBinder<string, R, B, P, any>>(apiDef.method, `request-api--${this.config.key}-${apiDef.key}`)
			.setRelativeUrl(`${this.config.relativeUrl}${apiDef.suffix ? "/" + apiDef.suffix : ""}`)
			.setOnError(this.errorHandler);
	}

	protected onError(request: BaseHttpRequest<any>, resError?: ErrorResponse<any>): boolean {
		return false;
	}

	create(toCreate: UType): BaseHttpRequest<ApiBinder_DBCreate<DBType>> {
		return this
			.createRequest<ApiBinder_DBCreate<DBType>>(DefaultApiDefs.Create)
			.setJsonBody(toCreate)
			.execute(async (response: DBType) => {
				return this.onEntryCreated(response);
			});
	}

	update = (toUpdate: DBType): BaseHttpRequest<ApiBinder_DBCreate<DBType>> => {
		return this
			.createRequest<ApiBinder_DBCreate<DBType>>(DefaultApiDefs.Update)
			.setJsonBody(toUpdate)
			.execute(async response => {
				return this.onEntryUpdated(response);
			});
	};

	query = (query?: Partial<DBType>): BaseHttpRequest<ApiBinder_DBQuery<DBType>> => {
		let _query = query;
		if (!_query)
			_query = {} as Partial<DBType>;

		return this
			.createRequest<ApiBinder_DBQuery<DBType>>(DefaultApiDefs.Query)
			.setJsonBody(_query)
			.execute(async response => {
				return this.onQueryReturned(response);
			});
	};

	unique = (_id: string): BaseHttpRequest<ApiBinder_DBUniuqe<DBType>> => {
		return this
			.createRequest<ApiBinder_DBUniuqe<DBType>>(DefaultApiDefs.Unique)
			.setUrlParams({_id})
			.execute(async response => {
				return this.onGotUnique(response);
			});
	};

	delete = (_id: string): BaseHttpRequest<ApiBinder_DBDelete<DBType>> => {
		return this
			.createRequest<ApiBinder_DBDelete<DBType>>(DefaultApiDefs.Delete)
			.setUrlParams({_id})
			.execute(async response => {
				return this.onEntryDeleted(response);
			});
	};

	protected abstract onEntryCreated(response: DBType): Promise<void>;

	protected abstract onEntryUpdated(response: DBType): Promise<void>;

	protected abstract onQueryReturned(response: DBType[]): Promise<void>;

	protected abstract onGotUnique(response: DBType): Promise<void>;

	protected abstract onEntryDeleted(response: DBType): Promise<void>;


}
