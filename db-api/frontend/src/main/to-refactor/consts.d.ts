/**
 * Data synchronization status for frontend modules.
 */
export declare enum DataStatus {
    NoData = 0,
    ContainsData = 1,
    UpdatingData = 2
}
/**
 * Single-item API event types.
 */
export declare const EventType_Create = "create";
export declare const EventType_Update = "update";
export declare const EventType_Delete = "delete";
export declare const EventType_Patch = "patch";
export declare const EventType_Unique = "unique";
export type SingleApiEvent = typeof EventType_Create | typeof EventType_Update | typeof EventType_Delete | typeof EventType_Patch | typeof EventType_Unique;
/**
 * Multi-item API event types.
 */
export declare const EventType_Query = "query";
export declare const EventType_UpsertAll = "upsert-all";
export declare const EventType_DeleteMulti = "delete-multi";
export type MultiApiEvent = typeof EventType_Query | typeof EventType_UpsertAll | typeof EventType_DeleteMulti;
