"use strict";
/*
 * Database API Generator is a utility library for Thunderstorm.
 *
 * Given proper configurations it will dynamically generate APIs to your Firestore
 * collections, will assert uniqueness and restrict deletion... and more
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleFE_SyncManagerV2 = exports.ModuleFE_SyncManagerV2_Class = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
const shared_1 = require("../../shared");
const ModuleFE_SyncManager_1 = require("./ModuleFE_SyncManager");
class ModuleFE_SyncManagerV2_Class extends ts_common_1.Module {
    constructor() {
        super();
        this.onReceivedSyncData = async (response) => {
            await ModuleFE_SyncManager_1.dispatch_syncIfNeeded.dispatchModuleAsync(response.syncData);
            ModuleFE_SyncManager_1.dispatch_onSyncCompleted.dispatchModule();
        };
        this.v1 = {
            checkSync: (0, frontend_1.apiWithQuery)(shared_1.ApiDef_SyncManagerV2.v1.checkSync, this.onReceivedSyncData)
        };
    }
}
exports.ModuleFE_SyncManagerV2_Class = ModuleFE_SyncManagerV2_Class;
exports.ModuleFE_SyncManagerV2 = new ModuleFE_SyncManagerV2_Class();
//# sourceMappingURL=ModuleFE_SyncManagerV2.js.map