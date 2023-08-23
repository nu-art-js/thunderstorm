"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATS_SyncEnvironment = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const React = require("react");
require("./ATS_SyncEnv.scss");
const ModuleFE_SyncEnv_1 = require("../../modules/ModuleFE_SyncEnv");
const ModuleFE_BaseDB_1 = require("../../modules/ModuleFE_BaseDB");
const ts_common_1 = require("@nu-art/ts-common");
class ATS_SyncEnvironment extends frontend_1.ComponentSync {
    constructor() {
        super(...arguments);
        this.syncEnv = async () => {
            if (!this.canSync())
                return;
            await (0, frontend_1.genericNotificationAction)(async () => {
                await ModuleFE_SyncEnv_1.ModuleFE_SyncEnv.vv1.fetchFromEnv((0, ts_common_1.filterKeys)({
                    env: this.state.selectedEnv,
                    backupId: this.state.backupId,
                    onlyModules: (this.state.onlyModules.size > 0 && Array.from(this.state.onlyModules)) || undefined,
                    excludedModules: Array.from(this.state.excludedModules),
                }, 'onlyModules')).executeSync();
            }, 'Syncing Env');
        };
        this.canSync = () => {
            return !!this.state.selectedEnv && !!this.state.backupId;
        };
        this.getCollectionModuleList = () => {
            return frontend_1.Thunder.getInstance().filterModules((module) => {
                //the moduleKey in ModuleBE_BaseDB's config is taken from collection's name.
                return module instanceof ModuleFE_BaseDB_1.ModuleFE_BaseDB && module.getCollectionName() !== undefined;
            }).map(module => module.getCollectionName()).sort();
        };
        this.renderOnlyModulesSelection = () => {
            const moduleNames = this.getCollectionModuleList();
            return React.createElement(React.Fragment, null,
                React.createElement(frontend_1.LL_H_C, { className: 'sync-env_modules-list' }, moduleNames.map(name => {
                    var _b;
                    return React.createElement(frontend_1.TS_Checkbox, { key: name, checked: (_b = this.state.onlyModules) === null || _b === void 0 ? void 0 : _b.has(name), onCheck: () => {
                            if (this.state.onlyModules.has(name))
                                this.state.onlyModules.delete(name);
                            else
                                this.state.onlyModules.add(name);
                            this.forceUpdate();
                        } }, name);
                })));
        };
        this.renderExcludedModulesSelection = () => {
            const moduleNames = this.getCollectionModuleList();
            return React.createElement(React.Fragment, null,
                React.createElement(frontend_1.LL_H_C, { className: 'sync-env_modules-list' }, moduleNames.map(name => React.createElement(frontend_1.TS_Checkbox, { key: name, checked: this.state.excludedModules.has(name), onCheck: () => {
                        if (this.state.excludedModules.has(name))
                            this.state.excludedModules.delete(name);
                        else
                            this.state.excludedModules.add(name);
                        this.forceUpdate();
                    } }, name))));
        };
    }
    deriveStateFromProps(nextProps, state) {
        var _b;
        state !== null && state !== void 0 ? state : (state = this.state ? Object.assign({}, this.state) : {});
        (_b = state.envList) !== null && _b !== void 0 ? _b : (state.envList = ['prod', 'staging', 'dev', 'local']);
        if (!state.excludedModules) {
            state.excludedModules = new Set();
            ['user-account--accounts', 'user-account--sessions'].forEach(name => state.excludedModules.add(name));
        }
        if (!state.onlyModules)
            state.onlyModules = new Set();
        return state;
    }
    render() {
        const envAdapter = (0, frontend_1.SimpleListAdapter)(this.state.envList, item => React.createElement("div", { className: 'node-data' }, item.item));
        return React.createElement(frontend_1.LL_V_L, { className: 'sync-env-page' },
            frontend_1.TS_AppTools.renderPageHeader('Sync Environment'),
            React.createElement(frontend_1.LL_H_C, { className: 'sync-env-page__main' },
                React.createElement(frontend_1.TS_PropRenderer.Vertical, { label: 'Environment' },
                    React.createElement(frontend_1.TS_DropDown, { placeholder: 'Select Environment', className: 'fancy', adapter: envAdapter, onSelected: env => this.setState({ selectedEnv: env }), selected: this.state.selectedEnv, canUnselect: true })),
                React.createElement(frontend_1.TS_PropRenderer.Vertical, { label: 'Backup ID' },
                    React.createElement(frontend_1.TS_Input, { type: 'text', value: this.state.backupId, onChange: val => this.setState({ backupId: val }) })),
                React.createElement(frontend_1.TS_BusyButton, { onClick: this.syncEnv, disabled: !this.canSync() }, "Sync")),
            React.createElement(frontend_1.TS_CollapsableContainer, { headerRenderer: frontend_1.TS_AppTools.renderPageHeader('Only Included Modules'), containerRenderer: this.renderOnlyModulesSelection }),
            React.createElement(frontend_1.TS_CollapsableContainer, { headerRenderer: frontend_1.TS_AppTools.renderPageHeader('Excluded Modules'), containerRenderer: this.renderExcludedModulesSelection }));
    }
}
_a = ATS_SyncEnvironment;
ATS_SyncEnvironment.screen = {
    name: 'Sync Environment',
    key: 'sync-environment',
    renderer: _a,
    group: 'TS Dev Tools'
};
exports.ATS_SyncEnvironment = ATS_SyncEnvironment;
//# sourceMappingURL=ATS_SyncEnv.js.map