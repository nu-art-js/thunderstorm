/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: These constants should be moved to a shared package or standardized.
 */
/**
 * Data synchronization status for frontend modules.
 */
export var DataStatus;
(function (DataStatus) {
    DataStatus[DataStatus["NoData"] = 0] = "NoData";
    DataStatus[DataStatus["ContainsData"] = 1] = "ContainsData";
    DataStatus[DataStatus["UpdatingData"] = 2] = "UpdatingData";
})(DataStatus || (DataStatus = {}));
/**
 * Single-item API event types.
 */
export const EventType_Create = 'create';
export const EventType_Update = 'update';
export const EventType_Delete = 'delete';
export const EventType_Patch = 'patch';
export const EventType_Unique = 'unique';
/**
 * Multi-item API event types.
 */
export const EventType_Query = 'query';
export const EventType_UpsertAll = 'upsert-all';
export const EventType_DeleteMulti = 'delete-multi';
//# sourceMappingURL=consts.js.map