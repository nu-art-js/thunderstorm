"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleBE_SyncEnv = void 0;
const thunderstorm_1 = require("@nu-art/thunderstorm");
const backend_1 = require("@nu-art/thunderstorm/backend");
const ts_common_1 = require("@nu-art/ts-common");
const shared_1 = require("../shared");
const BaseDB_ModuleBE_1 = require("./BaseDB_ModuleBE");
class ModuleBE_SyncEnv_Class extends ts_common_1.Module {
    constructor() {
        super();
        this.fetchFromEnv = (body) => __awaiter(this, void 0, void 0, function* () {
            this.logInfoBold('Received API call Fetch From Env!');
            this.logInfo(`Origin env: ${body.env}, bucketId: ${body.backupId}`);
            if (!body.env)
                throw new ts_common_1.BadImplementationException(`Did not receive env in the fetch from env api call!`);
            if (body.onlyModules && body.excludedModules)
                this.logWarningBold('excludedModules config exists alongside onlyModules, so excludedModules are ignored.');
            this.logInfo('\n\n\n\n\noyoyoyoyo');
            this.logInfo(this.config.urlMap);
            this.logInfo('\n\n\n\n\n');
            const url = `${this.config.urlMap[body.env]}/v1/fetch-backup-docs`;
            const outputDef = { method: thunderstorm_1.HttpMethod.GET, path: '', fullUrl: url };
            const requestBody = { backupId: body.backupId };
            const response = yield backend_1.AxiosHttpModule
                .createRequest(outputDef)
                .setUrlParams(requestBody)
                .executeSync();
            const wrongBackupIdDescriptor = response.backupDescriptors.find(descriptor => descriptor.backupId !== body.backupId);
            if (wrongBackupIdDescriptor)
                throw new ts_common_1.BadImplementationException(`Received backup descriptors with wrong backupId! provided id: ${body.backupId} received id: ${wrongBackupIdDescriptor.backupId}`);
            this.logInfo(`Found ${response.backupDescriptors.length} Backup Descriptors.`);
            yield Promise.all(response.backupDescriptors.map((backupDescriptor) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const moduleKey = backupDescriptor.moduleKey;
                const hasOnlyModulesArray = body.onlyModules && !!body.onlyModules.length;
                if (hasOnlyModulesArray && !((_a = body.onlyModules) === null || _a === void 0 ? void 0 : _a.includes(moduleKey))) {
                    this.logWarning(`Module ${moduleKey} is skipped from syncing due to not being in the list of specified modules to sync.`);
                    return;
                }
                if (!hasOnlyModulesArray && ((_b = body.excludedModules) === null || _b === void 0 ? void 0 : _b.includes(moduleKey))) {
                    this.logWarning(`Module ${moduleKey} is skipped from syncing due to being in the excluded modules list.`);
                    return;
                }
                const relevantModule = backend_1.Storm.getInstance().filterModules((module) => {
                    return module instanceof BaseDB_ModuleBE_1.BaseDB_ModuleBE && module.getCollectionName() === moduleKey;
                });
                if (relevantModule.length === 0) {
                    this.logErrorBold(`Failed to find collection module for collectionName: ${backupDescriptor.moduleKey}!`);
                    return;
                }
                const signedUrlDef = { method: thunderstorm_1.HttpMethod.GET, path: '', fullUrl: backupDescriptor.signedUrl };
                const backupFile = yield backend_1.AxiosHttpModule
                    .createRequest(signedUrlDef)
                    .executeSync();
                this.logInfo(backupDescriptor.moduleKey);
                this.logInfo(`Received backup descriptor for '${backupDescriptor.moduleKey}', found module name: ${relevantModule[0].getName()}, ${relevantModule[0].getCollectionName()}`);
                yield relevantModule[0].upsertAll(backupFile);
            })));
        });
        (0, backend_1.addRoutes)([(0, backend_1.createBodyServerApi)(shared_1.ApiDef_SyncEnv.vv1.fetchFromEnv, this.fetchFromEnv)]);
    }
}
exports.ModuleBE_SyncEnv = new ModuleBE_SyncEnv_Class();
//# sourceMappingURL=ModuleBE_SyncEnv.js.map