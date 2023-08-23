"use strict";
/*
 * A typescript & react boilerplate with api call example
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
exports.AppConfigKey_FE = exports.ModuleFE_AppConfig = exports.ModuleFE_AppConfig_Class = exports.dispatch_onAppConfigUpdated = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
const app_config_1 = require("../../shared/app-config");
const ModuleFE_BaseApi_1 = require("./ModuleFE_BaseApi");
exports.dispatch_onAppConfigUpdated = new frontend_1.ThunderDispatcher('__OnAppConfigUpdated');
class ModuleFE_AppConfig_Class extends ModuleFE_BaseApi_1.ModuleFE_BaseApi {
    constructor() {
        super(app_config_1.DBDef_AppConfigs, exports.dispatch_onAppConfigUpdated);
        this.appConfig = {};
        this.vv1 = {
            getConfigByKey: (0, frontend_1.apiWithQuery)(app_config_1.ApiDef_AppConfig.vv1.getConfigByKey),
        };
        const _onSyncCompleted = this.onSyncCompleted;
        this.onSyncCompleted = async (syncData) => {
            await _onSyncCompleted(syncData);
            const dbConfigs = this.cache.all();
            dbConfigs.forEach(dbConfig => this.appConfig[dbConfig.key] = dbConfig);
        };
    }
    async init() {
        super.init();
    }
    get(appConfigKey) {
        const config = this.cache.find(item => item.key === appConfigKey.key);
        return config.data;
    }
    async set(appConfigKey, data) {
        let _config = (0, ts_common_1.cloneObj)(this.cache.find(item => item.key === appConfigKey.key));
        if (!_config)
            _config = { key: appConfigKey.key };
        _config.data = data;
        await this.v1.upsert(_config).executeSync();
    }
    async delete(appConfigKey) {
        const config = this.cache.find(item => item.key === appConfigKey.key);
        if (!config)
            throw new ts_common_1.BadImplementationException('Config of this key does not exist');
        await this.v1.delete(config).executeSync();
    }
}
exports.ModuleFE_AppConfig_Class = ModuleFE_AppConfig_Class;
exports.ModuleFE_AppConfig = new ModuleFE_AppConfig_Class();
class AppConfigKey_FE {
    constructor(key) {
        this.key = key;
    }
    get() {
        return exports.ModuleFE_AppConfig.get(this);
    }
    async set(value) {
        // @ts-ignore
        await exports.ModuleFE_AppConfig.set(this, value);
    }
    async delete() {
        await exports.ModuleFE_AppConfig.delete(this);
    }
}
exports.AppConfigKey_FE = AppConfigKey_FE;
//# sourceMappingURL=ModuleFE_AppConfig.js.map