"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigKey_BE = exports.ModuleBE_AppConfig = void 0;
const backend_1 = require("@nu-art/thunderstorm/backend");
const ts_common_1 = require("@nu-art/ts-common");
const ModuleBE_BaseDBV2_1 = require("./ModuleBE_BaseDBV2");
const app_config_1 = require("../shared/app-config");
class ModuleBE_AppConfig_Class extends ModuleBE_BaseDBV2_1.ModuleBE_BaseDBV2 {
    constructor() {
        super(app_config_1.DBDef_AppConfigs);
        this.keyMap = {};
        this.createDefaults = async (logger = this) => {
            const keys = (0, ts_common_1._keys)(this.keyMap);
            for (const key of keys) {
                const config = await this.getAppKey(this.keyMap[key]);
                this.logInfo(`Set default data for key ${key}`);
                this.logInfo(config);
            }
        };
        (0, backend_1.addRoutes)([(0, backend_1.createQueryServerApi)(app_config_1.ApiDef_AppConfig.vv1.getConfigByKey, async (data) => {
                return this.getResolverDataByKey(data.key);
            })]);
    }
    registerKey(appConfigKey) {
        this.keyMap[appConfigKey.key] = appConfigKey;
    }
    getResolverDataByKey(key) {
        const appConfigKey = this.keyMap[key];
        if (!appConfigKey)
            throw new ts_common_1.ApiException(404, `Could not find an app config with key ${key}`);
        return this.getAppKey(appConfigKey);
    }
    async getAppKey(appConfigKey) {
        try {
            const config = await this.query.uniqueCustom({ where: { key: appConfigKey.key } });
            return config === null || config === void 0 ? void 0 : config.data;
        }
        catch (e) {
            const data = await appConfigKey.resolver();
            await this.setAppKey(appConfigKey, data);
            return data;
        }
    }
    async setAppKey(appConfigKey, data) {
        let _config;
        try {
            _config = await this.query.uniqueCustom({ where: { key: appConfigKey.key } });
        }
        catch (e) {
            _config = { key: appConfigKey.key };
        }
        _config.data = data;
        return this.set.item(_config);
    }
    async _deleteAppKey(appConfigKey) {
        await this.delete.query({ where: { key: appConfigKey.key } });
    }
}
exports.ModuleBE_AppConfig = new ModuleBE_AppConfig_Class();
//TODO: Add validation by key
class AppConfigKey_BE {
    constructor(key, resolver) {
        this.key = key;
        this.resolver = resolver;
        exports.ModuleBE_AppConfig.registerKey(this);
    }
    async get() {
        return await exports.ModuleBE_AppConfig.getAppKey(this);
    }
    async set(value) {
        // @ts-ignore
        await exports.ModuleBE_AppConfig.setAppKey(this, value);
    }
    async delete() {
        await exports.ModuleBE_AppConfig._deleteAppKey(this);
    }
}
exports.AppConfigKey_BE = AppConfigKey_BE;
//# sourceMappingURL=ModuleBE_AppConfig.js.map