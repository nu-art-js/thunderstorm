/*
 * @nu-art/app-config-shared - App config entity types and CrudTypes
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DB_Object} from '@nu-art/db-api-shared';

/** App-config DB item: key + data payload. */
export type DB_AppConfig<D = unknown> = DB_Object & {
	key: string;
	data: D;
};

/** UI/modifiable shape for app-config (same as DB minus generated). */
export type UI_AppConfig<D = unknown> = Omit<DB_AppConfig<D>, keyof DB_Object> & Partial<Pick<DB_Object, '_id'>>;

export const DBKey_AppConfig = 'app-configs' as const;
export const EntityName_AppConfig = 'AppConfig';
export const Versions_AppConfig = ['1.0.0'] as const;
