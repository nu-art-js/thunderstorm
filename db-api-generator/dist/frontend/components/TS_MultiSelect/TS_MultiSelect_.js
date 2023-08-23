"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TS_MultiSelect_ = void 0;
const React = require("react");
const react_1 = require("react");
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
class TS_MultiSelect_ extends react_1.Component {
    static prepare(_props) {
        return (props) => React.createElement(TS_MultiSelect_, Object.assign({}, _props, props));
    }
    render() {
        const editable = this.props.editable;
        const prop = this.props.prop;
        const existingItems = (editable.item[prop] || (editable.item[prop] = []));
        const selectedIds = existingItems;
        let onNoMatchingSelectionForString = undefined;
        const addInnerItem = async (item) => {
            const ids = [...selectedIds, item];
            await editable.update(prop, ids);
            this.forceUpdate();
        };
        const props = this.props;
        if (props.createNewItemFromLabel)
            onNoMatchingSelectionForString = async (filterText, matchingItems, e) => {
                const item = await props.createNewItemFromLabel(filterText, matchingItems, e);
                await addInnerItem.call(this, item);
            };
        return React.createElement(frontend_1.LL_H_C, { className: (0, frontend_1._className)('ts-values-list', this.props.className) },
            selectedIds.map((selectedId, i) => {
                var _a;
                const itemToAdd = (_a = props.itemResolver) === null || _a === void 0 ? void 0 : _a.call(props).find(i => i === selectedId);
                return React.createElement(frontend_1.LL_H_C, { className: "ts-values-list__value", key: i }, props.itemRenderer(itemToAdd, async () => {
                    (0, ts_common_1.removeItemFromArray)(selectedIds, selectedId);
                    await editable.update(prop, existingItems);
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
        return React.createElement(SelectionRenderer, { queryFilter: item => !props.selectedIds.includes(item), selected: undefined, onSelected: props.onSelected, placeholder: props.placeholder, noOptionsRenderer: props.noOptionsRenderer, onNoMatchingSelectionForString: props.onNoMatchingSelectionForString, itemResolver: props.itemResolver });
    }
}
exports.TS_MultiSelect_ = TS_MultiSelect_;
//# sourceMappingURL=TS_MultiSelect_.js.map