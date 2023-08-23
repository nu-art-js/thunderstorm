"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATS_SyncEnvironmentV2 = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const React = require("react");
require("./ATS_SyncEnvV2.scss");
const ModuleFE_BaseDB_1 = require("../../modules/ModuleFE_BaseDB");
const ModuleFE_SyncEnvV2_1 = require("../../modules/ModuleFE_SyncEnvV2");
const ts_common_1 = require("@nu-art/ts-common");
class ATS_SyncEnvironmentV2 extends frontend_1.ComponentSync {
    constructor() {
        super(...arguments);
        this.fetchMetadata = async () => {
            var _b;
            if (!((_b = this.state.backupId) === null || _b === void 0 ? void 0 : _b.length))
                return;
            if (!this.state.selectedEnv)
                return;
            this.setState({ fetchMetadataInProgress: true });
            try {
                await (0, frontend_1.genericNotificationAction)(async () => {
                    const metadata = await ModuleFE_SyncEnvV2_1.ModuleFE_SyncEnvV2.vv1.fetchBackupMetadata({
                        env: this.state.selectedEnv,
                        backupId: this.state.backupId,
                    }).executeSync();
                    this.setState({ metadata: metadata });
                }, 'Fetching backup metadata');
            }
            catch (err) {
                this.logError(err);
            }
            this.setState({ fetchMetadataInProgress: false });
        };
        this.syncEnv = async () => {
            if (!this.canSync())
                return;
            const start = performance.now();
            await (0, frontend_1.genericNotificationAction)(async () => {
                await ModuleFE_SyncEnvV2_1.ModuleFE_SyncEnvV2.vv1.fetchFromEnv((0, ts_common_1.filterKeys)({
                    env: this.state.selectedEnv,
                    backupId: this.state.backupId,
                    selectedModules: Array.from(this.state.selectedModules)
                }, 'selectedModules')).executeSync();
            }, 'Syncing Env');
            const end = performance.now();
            this.setState({ restoreTime: `${((end - start) / 1000).toFixed(3)} seconds` });
        };
        this.syncFirebase = async () => {
            if (!this.canSync())
                return;
            await (0, frontend_1.genericNotificationAction)(async () => {
                await ModuleFE_SyncEnvV2_1.ModuleFE_SyncEnvV2.vv1.fetchFirebaseBackup({
                    env: this.state.selectedEnv,
                    backupId: this.state.backupId
                }).executeSync();
            }, 'Syncing Firebase');
        };
        this.createNewBackup = async () => {
            return (0, frontend_1.genericNotificationAction)(async () => {
                this.setState({ backingUpInProgress: true }, async () => {
                    const toRet = await ModuleFE_SyncEnvV2_1.ModuleFE_SyncEnvV2.vv1.createBackup({}).executeSync();
                    this.setState({ backingUpInProgress: false });
                    return toRet;
                });
            }, 'Create Backup');
        };
        this.canSync = () => {
            return !!this.state.selectedEnv && !!this.state.backupId;
        };
        this.renderBackupModules = () => {
            return React.createElement(React.Fragment, null,
                React.createElement(frontend_1.LL_V_L, { className: 'sync-env_modules-list-v2' },
                    React.createElement(frontend_1.LL_H_C, { className: 'utils' },
                        React.createElement(frontend_1.TS_Checkbox, { checked: this.state.selectAll, onCheck: status => this.reDeriveState({ selectAll: status }) }, "Select All"),
                        React.createElement(frontend_1.TS_Input, { onChange: val => this.setState({ searchFilter: val }), type: 'text', placeholder: 'sreach collection' })),
                    this.state.moduleList.map(name => {
                        var _b;
                        const collectionMetadata = (_b = this.state.metadata) === null || _b === void 0 ? void 0 : _b.collectionsData.find(collection => collection.collectionName === name);
                        if ((this.state.searchFilter && this.state.searchFilter.length) && !name.includes(this.state.searchFilter))
                            return;
                        return React.createElement(frontend_1.TS_PropRenderer.Horizontal, { label: React.createElement(frontend_1.LL_H_C, { className: 'header' },
                                React.createElement(frontend_1.TS_Checkbox, { checked: this.state.selectedModules.has(name), onCheck: () => {
                                        if (this.state.selectedModules.has(name))
                                            this.state.selectedModules.delete(name);
                                        else
                                            this.state.selectedModules.add(name);
                                        let isAllSelected = true;
                                        if (this.state.selectedModules.size < this.state.moduleList.length)
                                            isAllSelected = false;
                                        this.setState({
                                            selectedModules: new Set(Array.from(this.state.selectedModules)),
                                            selectAll: isAllSelected
                                        });
                                    } }),
                                React.createElement("div", null, name)), key: name },
                            React.createElement(frontend_1.LL_H_C, { className: 'collection-row' },
                                React.createElement(frontend_1.LL_H_C, { className: 'backup-info' },
                                    React.createElement("div", null, (collectionMetadata === null || collectionMetadata === void 0 ? void 0 : collectionMetadata.numOfDocs) !== undefined ? collectionMetadata === null || collectionMetadata === void 0 ? void 0 : collectionMetadata.numOfDocs : '--'),
                                    "|",
                                    React.createElement("div", { className: 'left-row' }, (collectionMetadata === null || collectionMetadata === void 0 ? void 0 : collectionMetadata.version) || '--'))));
                    })));
        };
    }
    deriveStateFromProps(nextProps, state) {
        var _b, _c;
        state !== null && state !== void 0 ? state : (state = this.state ? Object.assign({}, this.state) : {});
        (_b = state.envList) !== null && _b !== void 0 ? _b : (state.envList = ['prod', 'staging', 'dev', 'local']);
        if (!state.selectedModules)
            state.selectedModules = new Set();
        state.moduleList = this.getCollectionModuleList();
        (_c = state.selectAll) !== null && _c !== void 0 ? _c : (state.selectAll = true);
        if (state.selectAll) {
            state.moduleList.map(collection => state.selectedModules.add(collection));
        }
        else {
            state.moduleList.map(collection => state.selectedModules.delete(collection));
        }
        return state;
    }
    getCollectionModuleList() {
        return frontend_1.Thunder.getInstance().filterModules((module) => {
            //the moduleKey in ModuleBE_BaseDB's config is taken from collection's name.
            return module instanceof ModuleFE_BaseDB_1.ModuleFE_BaseDB && module.getCollectionName() !== undefined;
        }).map(module => module.getCollectionName()).sort();
    }
    render() {
        const envAdapter = (0, frontend_1.SimpleListAdapter)(this.state.envList, item => React.createElement("div", { className: 'node-data' }, item.item));
        return React.createElement(frontend_1.LL_V_L, { className: 'sync-env-page' },
            React.createElement(frontend_1.LL_H_C, null,
                frontend_1.TS_AppTools.renderPageHeader('Sync Environment V2'),
                React.createElement(frontend_1.TS_BusyButton, { onClick: this.createNewBackup }, "Trigger Backup")),
            React.createElement(frontend_1.LL_H_C, { className: 'sync-env-page__main' },
                React.createElement(frontend_1.TS_PropRenderer.Vertical, { label: 'Environment' },
                    React.createElement(frontend_1.TS_DropDown, { placeholder: 'Select Environment', className: 'fancy', adapter: envAdapter, onSelected: env => {
                            this.setState({ selectedEnv: env });
                            return this.fetchMetadata();
                        }, selected: this.state.selectedEnv, canUnselect: true })),
                React.createElement(frontend_1.TS_PropRenderer.Vertical, { label: 'Backup ID' },
                    React.createElement(frontend_1.TS_Input, { type: 'text', value: this.state.backupId, onBlur: val => {
                            if (!val.match(/^[0-9A-Fa-f]{32}$/))
                                return;
                            this.setState({ backupId: val });
                            return this.fetchMetadata();
                        } })),
                React.createElement("div", { className: (0, frontend_1._className)(!this.state.fetchMetadataInProgress && 'hidden') },
                    React.createElement(frontend_1.TS_Loader, null)),
                React.createElement(frontend_1.TS_BusyButton, { onClick: this.syncEnv, disabled: !this.canSync() }, "Restore"),
                React.createElement(frontend_1.TS_BusyButton, { onClick: this.syncFirebase, disabled: !this.canSync() }, "Restore Firebase"),
                this.state.restoreTime && React.createElement("div", null, this.state.restoreTime)),
            this.canSync() && this.renderBackupModules());
    }
}
_a = ATS_SyncEnvironmentV2;
ATS_SyncEnvironmentV2.screen = {
    name: 'Sync Environment V2',
    key: 'sync-environment-v2',
    renderer: _a,
    group: 'TS Dev Tools'
};
exports.ATS_SyncEnvironmentV2 = ATS_SyncEnvironmentV2;
//# sourceMappingURL=ATS_SyncEnvV2.js.map