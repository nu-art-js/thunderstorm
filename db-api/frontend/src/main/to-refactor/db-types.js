/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: These types should come from @nu-art/db-api-shared or be standardized.
 */
/**
 * Keys that are part of DB_Object (not user-defined fields).
 */
export const KeysOfDB_Object = ['_id', '__created', '__updated', '_v'];
/**
 * Generate frontend module config from database definition.
 */
export function getModuleFEConfig(dbDef) {
    return {
        key: dbDef.dbKey,
        validator: dbDef.modifiablePropsValidator,
        dbConfig: {
            name: dbDef.frontend?.name ?? dbDef.dbKey,
            group: dbDef.frontend?.group ?? 'default',
            version: dbDef.versions[0],
            uniqueKeys: (dbDef.uniqueKeys ?? ['_id']),
        },
        versions: dbDef.versions,
    };
}
//# sourceMappingURL=db-types.js.map