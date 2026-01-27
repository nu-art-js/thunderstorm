/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleFE_BaseDB, ModuleSyncType} from './ModuleFE_BaseDB.js';
import {EventDispatcher, NoOpDispatcher} from '../to-refactor/index.js';
import {ApiCallContext} from '../decorators/types.js';
import {ModuleTypes, BaseDBConfig} from './types.js';


/**
 * Base API module for frontend database operations.
 *
 * Extends BaseDB with API-specific functionality. Use the @ClientApi and
 * @ClientApiQuery decorators to define API endpoints.
 *
 * @template Types - ModuleTypes that define the entity types (decoupled from Proto)
 *
 * @example
 * ```typescript
 * type UserModuleTypes = ModuleTypes<DB_User, UI_User, Validator_UI_User, ['_id']>;
 * 
 * class UserModule extends BaseApi<UserModuleTypes> {
 *   constructor() {
 *     super({
 *       dbKey: 'user',
 *       validator: Proto_User.modifiablePropsValidator,
 *       uniqueKeys: ['_id'],
 *       versions: ['v1'],
 *       dbConfig: { name: 'user', group: 'default', version: 'v1', uniqueKeys: ['_id'] }
 *     });
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
export abstract class ModuleFE_BaseApi<Types extends ModuleTypes>
	extends ModuleFE_BaseDB<Types> {

	protected constructor(
		config: BaseDBConfig<Types>,
		dispatcher: EventDispatcher = NoOpDispatcher
	) {
		super(config, ModuleSyncType.APISync, dispatcher);
	}

	/**
	 * Clean up data before sending to API.
	 * Override to add custom cleanup logic.
	 */
	protected cleanUp(toUpsert: Types['uiItem']): Types['uiItem'] {
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
