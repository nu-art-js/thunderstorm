"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATS_CollectionUpgrades = void 0;
const React = require("react");
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
require("./ATS_CollectionUpgrades.scss");
const SmartComponent_1 = require("../../components/SmartComponent");
class ATS_CollectionUpgrades extends SmartComponent_1.SmartComponent {
    constructor() {
        super(...arguments);
        this.upgradeCollection = async (collectionName, module) => {
            await (0, frontend_1.genericNotificationAction)(async () => {
                await module.v1.upgradeCollection({ forceUpdate: true }).setTimeout(5 * ts_common_1.Minute).executeSync();
            }, `Upgrading ${collectionName}`);
        };
    }
    async deriveStateFromProps(nextProps, state) {
        var _b;
        (_b = state.upgradableModules) !== null && _b !== void 0 ? _b : (state.upgradableModules = (0, ts_common_1.sortArray)(frontend_1.Thunder.getInstance().filterModules(module => {
            const _module = module;
            return (!!_module.getCollectionName && !!_module.v1.upgradeCollection);
        }), i => i.getCollectionName()));
        return state;
    }
    render() {
        return React.createElement("div", { className: 'collection-upgrades-page' },
            frontend_1.TS_AppTools.renderPageHeader('Collection Upgrades'),
            React.createElement(frontend_1.LL_H_C, { className: 'buttons-container' }, this.state.upgradableModules.map(module => {
                const name = module.getCollectionName().replace(/-/g, ' ');
                return React.createElement(frontend_1.TS_BusyButton, { key: name, onClick: () => this.upgradeCollection(name, module) },
                    name,
                    " (",
                    module.cache.all().length,
                    ")");
            })));
    }
}
_a = ATS_CollectionUpgrades;
ATS_CollectionUpgrades.defaultProps = {
    modules: () => frontend_1.Thunder.getInstance().filterModules(module => module.ModuleFE_BaseDB)
};
ATS_CollectionUpgrades.screen = {
    name: 'Collection Upgrades',
    key: 'collection-upgrades',
    renderer: _a,
    group: 'TS Dev Tools'
};
exports.ATS_CollectionUpgrades = ATS_CollectionUpgrades;
//# sourceMappingURL=ATS_CollectionUpgrades.js.map