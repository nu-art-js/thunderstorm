/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BaseDB, ModuleSyncType} from './BaseDB.js';
import {DBDef_V3, DBProto, EventDispatcher, NoOpDispatcher} from '../to-refactor/index.js';
import {ApiCallContext} from '../decorators/types.js';


/**
 * Base API module for frontend database operations.
 *
 * Extends BaseDB with API-specific functionality. Use the @ClientApi and
 * @ClientApiQuery decorators to define API endpoints.
 *
 * @template Proto - Database prototype type
 *
 * @example
 * ```typescript
 * class UserModule extends BaseApi<Proto_User> {
 *   constructor() {
 *     super(DBDef_User);
 *   }
 *
 *   @ClientApi(UserApiDef.v1.upsert, {
 *     onComplete: (module, ctx) => module.handleUpsertComplete(ctx)
 *   })
 *   async upsert(body: UI_User): Promise<DB_User> {
 *     body = this.cleanUp(body);
 *     this.validateInternal(body);
 *   }
 *
 *   private handleUpsertComplete(ctx: ApiCallContext<typeof UserApiDef.v1.upsert>) {
 *     this.onEntryUpdated(ctx.response, ctx.body!);
 *     this.IDB.setLastUpdated(ctx.response.__updated);
 *   }
 * }
 * ```
 */
export abstract class BaseApi<Proto extends DBProto<any>>
	extends BaseDB<Proto> {

	protected constructor(
		dbDef: DBDef_V3<Proto>,
		dispatcher: EventDispatcher = NoOpDispatcher
	) {
		super(dbDef, ModuleSyncType.APISync, dispatcher);
	}

	/**
	 * Clean up data before sending to API.
	 * Override to add custom cleanup logic.
	 */
	protected cleanUp(toUpsert: Proto['uiType']): Proto['uiType'] {
		return toUpsert;
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
		const items = ctx.response as Proto['dbType'][];
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
		await this.onEntriesDeleted(ctx.response);
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
