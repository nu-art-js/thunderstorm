"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TS_MultiSelect = void 0;
const React = require("react");
const react_1 = require("react");
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
class TS_MultiSelect extends react_1.Component {
    static prepare(_props) {
        return (props) => React.createElement(TS_MultiSelect, Object.assign({}, _props, props));
    }
    render() {
        const editable = this.props.editable;
        const prop = this.props.prop;
        const selectedIdsAsPropType = (editable.item[prop] || (editable.item[prop] = []));
        const selectedIds = selectedIdsAsPropType;
        let onNoMatchingSelectionForString = undefined;
        const addInnerItem = async (dbItem) => {
            const ids = [...selectedIds, dbItem._id];
            await editable.update(prop, ids);
            this.forceUpdate();
        };
        const props = this.props;
        if (props.createNewItemFromLabel)
            onNoMatchingSelectionForString = async (filterText, matchingItems, e) => {
                const item = await props.createNewItemFromLabel(filterText, matchingItems, e);
                const dbItem = await props.module.v1.upsert(item).executeSync();
                await addInnerItem.call(this, dbItem);
            };
        return React.createElement(frontend_1.LL_H_C, { className: (0, frontend_1._className)('ts-values-list', this.props.className) },
            selectedIds.map(selectedId => {
                var _a;
                const itemToAdd = ((_a = props.itemResolver) === null || _a === void 0 ? void 0 : _a.call(props).find(i => i._id === selectedId)) || props.module.cache.unique(selectedId);
                return React.createElement(frontend_1.LL_H_C, { className: "ts-values-list__value", key: selectedId }, props.itemRenderer(itemToAdd, async () => {
                    (0, ts_common_1.removeItemFromArray)(selectedIds, selectedId);
                    await editable.update(prop, selectedIdsAsPropType);
                }));
            }),
            this.renderSelector({
                selectionRenderer: props.selectionRenderer,
                placeholder: props.placeholder,
                noOptionsRenderer: props.noOptionsRenderer,
                selectedIds,
                onNoMatchingSelectionForString: onNoMatchingSelectionForString,
                onSelected: addInnerItem,
                itemResolver: props.itemResolver
            }));
    }
    renderSelector(props) {
        const SelectionRenderer = props.selectionRenderer;
        return React.createElement(SelectionRenderer, { queryFilter: item => !props.selectedIds.includes(item._id), selected: undefined, onSelected: props.onSelected, placeholder: props.placeholder, noOptionsRenderer: props.noOptionsRenderer, onNoMatchingSelectionForString: props.onNoMatchingSelectionForString, itemResolver: props.itemResolver });
    }
}
exports.TS_MultiSelect = TS_MultiSelect;
//# sourceMappingURL=TS_MultiSelect.js.map