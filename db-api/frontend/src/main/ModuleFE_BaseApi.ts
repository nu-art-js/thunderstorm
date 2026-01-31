/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleFE_BaseDB, ModuleSyncType} from './ModuleFE_BaseDB.js';
import {ApiCallContext, ApiCaller, HttpClient} from '@nu-art/http-client';
import {BaseDBConfig} from './types.js';
import {EventDispatcher} from './to-refactor/dispatcher.js';
import {ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {CrudApiDef_Type, CrudApiTypes, CrudTypes} from '@nu-art/db-api-shared';


type RequestType = 'upsert' | 'patch' | 'delete';

type PendingOp = {
	requestType: RequestType;
	fn: () => Promise<unknown>;
	resolve: (value: unknown) => void;
	reject: (reason: unknown) => void;
};

type Operation = {
	running: { requestType: RequestType; promise: Promise<unknown> };
	pending?: PendingOp;
};


interface Params<Types extends CrudTypes> {
	config: BaseDBConfig<Types>,
	crudApiDef: CrudApiDef_Type<Types>,
	dispatcher?: EventDispatcher
	httpClient?: HttpClient
}

/**
 * Base API module for frontend database operations.
 *
 * CRUD methods (query, queryUnique, upsert, upsertAll, patch, delete, deleteQuery, deleteAll)
 * are declared and implemented in the base, using @ApiCaller with lazy
 * getters over readonly crudApiDef. Pass your ApiDef (e.g. MyApiDef.v1) into the constructor;
 * the base stores it as readonly crudApiDef.
 *
 * @template Types - CrudTypes that define the entity types (decoupled from Proto)
 *
 * @example
 * ```typescript
 * class UserModule extends ModuleFE_BaseApi<UserCrudTypes> {
 *   constructor(config: BaseDBConfig<UserCrudTypes>) {
 *     super(config, UserApiDef.v1);
 *   }
 * }
 * await UserModule.query({});
 * await UserModule.upsert(uiUser);
 * ```
 */
export abstract class ModuleFE_BaseApi<Types extends CrudTypes>
	extends ModuleFE_BaseDB<Types> {

	readonly crudApiDef: CrudApiDef_Type<Types>;
	readonly httpClient: ResolvableContent<HttpClient>;
	private operationsById: Map<string, Operation> = new Map();

	protected constructor(params: Params<Types>) {
		super(params.config, ModuleSyncType.APISync, params.dispatcher);
		this.crudApiDef = params.crudApiDef;
		this.httpClient = params.httpClient ?? (() => HttpClient.default);
	}


	/**
	 * Run a Promise-returning function serialized per document id.
	 * Only one upsert/patch/delete runs at a time per id; further work is queued.
	 * Throws if a delete is running or queued for that id.
	 */
	protected runSerializedById<T>(id: string | undefined, requestType: RequestType, fn: () => Promise<T>): Promise<T> {
		if (id === undefined || id === null || id === '')
			return fn();

		const op = this.operationsById.get(id);
		if (op) {
			if (op.running.requestType === 'delete' || op.pending?.requestType === 'delete')
				throw new Error(`Item with id ${id} is marked for deletion`);
			const p = new Promise<T>((resolve, reject) => {
				const pending: PendingOp = {
					requestType,
					fn: fn as () => Promise<unknown>,
					resolve: resolve as (value: unknown) => void,
					reject
				};
				if (!op.pending) {
					(op as { pending?: PendingOp }).pending = pending;
					op.running.promise.finally(() => this.runNext(id));
				} else
					reject(new Error(`Item ${id}: only one pending operation allowed`));
			});
			return p;
		}

		const promise = fn();
		this.operationsById.set(id, {running: {requestType, promise}});
		promise.finally(() => this.runNext(id));
		return promise;
	}

	private runNext(id: string): void {
		const op = this.operationsById.get(id);
		if (!op?.pending) {
			this.operationsById.delete(id);
			return;
		}
		const {pending} = op;
		(op as { pending?: PendingOp }).pending = undefined;
		const nextPromise = pending.fn().then(pending.resolve, pending.reject);
		(op as { running: Operation['running'] }).running = {requestType: pending.requestType, promise: nextPromise};
		nextPromise.finally(() => this.runNext(id));
	}

	/**
	 * Clean up data before sending to API.
	 * Override to add custom cleanup logic.
	 */
	protected cleanUp(toUpsert: Types['uiItem']): Types['uiItem'] {
		return toUpsert;
	}

	@ApiCaller<CrudApiTypes<Types>['query']>(
		(m: ModuleFE_BaseApi<Types>) => m.crudApiDef.query,
		{
			httpClient: m => resolveContent(m.httpClient),
			onComplete: (m, ctx) => m.handleQueryComplete(ctx)
		}
	)
	async query(body: CrudApiTypes<Types>['query']['Params']): Promise<CrudApiTypes<Types>['query']['Response']> {
		void body;
		return undefined as unknown as CrudApiTypes<Types>['query']['Response'];
	}

	@ApiCaller(
		(m: ModuleFE_BaseApi<Types>) => m.crudApiDef.queryUnique,
		{
			httpClient: m => resolveContent(m.httpClient),
			onComplete: (m, ctx) => m.handleQueryUniqueComplete(ctx)
		}
	)
	async queryUnique(params: CrudApiTypes<Types>['queryUnique']['Params']): Promise<CrudApiTypes<Types>['queryUnique']['Response']> {
		void params;
		return undefined as unknown as CrudApiTypes<Types>['queryUnique']['Response'];
	}

	@ApiCaller(
		(m: ModuleFE_BaseApi<Types>) => m.crudApiDef.upsert,
		{
			httpClient: m => resolveContent(m.httpClient),
			onComplete: (m, ctx) => m.handleUpsertComplete(ctx)
		}
	)
	async upsert(body: CrudApiTypes<Types>['upsert']['Body']): Promise<CrudApiTypes<Types>['upsert']['Response']> {
		body = this.cleanUp(body);
		this.validateInternal(body);
		return undefined as unknown as CrudApiTypes<Types>['upsert']['Response'];
	}

	@ApiCaller(
		(m: ModuleFE_BaseApi<Types>) => m.crudApiDef.upsertAll,
		{
			httpClient: m => resolveContent(m.httpClient),
			onComplete: (m, ctx) => m.handleUpsertAllComplete(ctx)
		}
	)
	async upsertAll(body: CrudApiTypes<Types>['upsertAll']['Body']): Promise<CrudApiTypes<Types>['upsertAll']['Response']> {
		void body;
		return undefined as unknown as CrudApiTypes<Types>['upsertAll']['Response'];
	}

	@ApiCaller(
		(m: ModuleFE_BaseApi<Types>) => m.crudApiDef.deleteUnique,
		{
			httpClient: m => resolveContent(m.httpClient),
			onComplete: (m, ctx) => m.handleDeleteComplete(ctx)
		}
	)
	async delete(params: CrudApiTypes<Types>['deleteUnique']['Params']): Promise<CrudApiTypes<Types>['deleteUnique']['Response']> {
		void params;
		return undefined as unknown as CrudApiTypes<Types>['deleteUnique']['Response'];
	}

	@ApiCaller(
		(m: ModuleFE_BaseApi<Types>) => m.crudApiDef.deleteQuery,
		{
			httpClient: m => resolveContent(m.httpClient),
			onComplete: (m, ctx) => m.handleDeleteQueryComplete(ctx)
		}
	)
	async deleteQuery(body: Record<string, unknown> = {}): Promise<Types['dbItem'][]> {
		void body;
		return undefined as unknown as Types['dbItem'][];
	}

	@ApiCaller((m: ModuleFE_BaseApi<Types>) => m.crudApiDef.deleteAll, {
		httpClient: m => resolveContent(m.httpClient),
	})
	async deleteAll(params: CrudApiTypes<Types>['deleteAll']['Params']): Promise<CrudApiTypes<Types>['deleteAll']['Response']> {
		void params;
		return undefined as unknown as CrudApiTypes<Types>['deleteAll']['Response'];
	}


	/**
	 * Standard callback for upsert operations.
	 * Updates cache, IDB, and dispatches events.
	 */
	protected handleUpsertComplete = async (ctx: ApiCallContext<any>) => {
		await this.onEntryUpdated(ctx.response, ctx.body);
		this.IDB.setLastUpdated(ctx.response.__updated);
	};

	/**
	 * Standard callback for upsertAll operations.
	 */
	protected handleUpsertAllComplete = async (ctx: ApiCallContext<any>) => {
		const items = ctx.response as Types['dbItem'][];
		await this.onEntriesUpdated(items);
		const lastUpdated = items.reduce((acc, item) => Math.max(acc, item.__updated), -1);
		this.IDB.setLastUpdated(lastUpdated);
	};

	/**
	 * Standard callback for patch operations.
	 */
	protected handlePatchComplete = async (ctx: ApiCallContext<any>) => {
		await this.onEntryPatched(ctx.response);
	};

	/**
	 * Standard callback for delete operations.
	 */
	protected handleDeleteComplete = async (ctx: ApiCallContext<any>) => {
		if (ctx.response)
			await this.onEntryDeleted(ctx.response);
	};

	/**
	 * Standard callback for deleteQuery operations.
	 */
	protected handleDeleteQueryComplete = async (ctx: ApiCallContext<any>) => {
		await this.onEntriesDeleted(ctx.response ?? []);
	};

	/**
	 * Standard callback for query operations.
	 */
	protected handleQueryComplete = async (ctx: ApiCallContext<any>) => {
		await this.onQueryReturned(ctx.response);
	};

	/**
	 * Standard callback for queryUnique operations.
	 */
	protected handleQueryUniqueComplete = async (ctx: ApiCallContext<any>) => {
		await this.onGotUnique(ctx.response);
	};
}
