"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDispatcher = exports.DataStatus = exports.SyncStatus = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
var SyncStatus;
(function (SyncStatus) {
    SyncStatus[SyncStatus["loading"] = 0] = "loading";
    SyncStatus[SyncStatus["idle"] = 1] = "idle";
    SyncStatus[SyncStatus["read"] = 2] = "read";
    SyncStatus[SyncStatus["write"] = 3] = "write";
})(SyncStatus = exports.SyncStatus || (exports.SyncStatus = {}));
var DataStatus;
(function (DataStatus) {
    DataStatus[DataStatus["NoData"] = 0] = "NoData";
    DataStatus[DataStatus["UpdatingData"] = 1] = "UpdatingData";
    DataStatus[DataStatus["ContainsData"] = 2] = "ContainsData";
})(DataStatus = exports.DataStatus || (exports.DataStatus = {}));
exports.syncDispatcher = new frontend_1.ThunderDispatcher('__onSyncStatusChanged');
//# sourceMappingURL=consts.js.map