/*
 * Database API infrastructure library for Thunderstorm.
 *
 * Shared CRUD type definitions for FE and BE modules (no Proto).
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

import type {ValidatorTypeResolver} from '@nu-art/ts-common';

/**
 * Minimal type definition for CRUD modules (frontend and backend).
 *
 * Decoupled from Proto; the application derives this from Proto and passes it in.
 * Used by ModuleFE_BaseDB/ModuleFE_BaseApi and ModuleBE_BaseDB/ModuleBE_BaseApi.
 *
 * @template DBKey - Collection key (e.g. 'account')
 * @template DBItem - Full database object type (has _id and DB metadata)
 * @template UIItem - UI/input type for upsert
 * @template Validator - Validator function type (matches UIItem; BE may ignore)
 * @template UniqueKeys - Array of unique key names
 */
export type CrudTypes<
	DBKey extends string = string,
	DBItem extends object = object,
	UIItem extends object = object,
	Validator extends ValidatorTypeResolver<UIItem> = ValidatorTypeResolver<UIItem>,
	UniqueKeys extends (keyof DBItem)[] = (keyof DBItem)[]
> = {
	readonly dbKey: DBKey;
	readonly dbItem: DBItem;
	readonly uiItem: UIItem;
	readonly validator: Validator;
	readonly uniqueKeys: UniqueKeys;
};

/** @deprecated Use CrudTypes. Kept for backward compatibility. */
export type ModuleTypes<
	DBKey extends string = string,
	DBItem extends object = object,
	UIItem extends object = object,
	Validator extends ValidatorTypeResolver<UIItem> = ValidatorTypeResolver<UIItem>,
	UniqueKeys extends (keyof DBItem)[] = (keyof DBItem)[]
> = CrudTypes<DBKey, DBItem, UIItem, Validator, UniqueKeys>;
