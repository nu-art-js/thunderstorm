"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBItemDropDownMultiSelector = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const React = require("react");
class DBItemDropDownMultiSelector extends frontend_1.ComponentSync {
    render() {
        const UISelector = this.props.uiSelector;
        const selector = this.props.selector;
        return React.createElement(UISelector, { queryFilter: item => !selector.existingItems.includes(item._id), onSelected: item => selector.onSelected(item._id) });
    }
    deriveStateFromProps(nextProps, state) {
        return { onSelected: nextProps.selector.onSelected };
    }
}
DBItemDropDownMultiSelector.selector = (uiSelector) => {
    return (selector) => React.createElement(DBItemDropDownMultiSelector, { selector: selector, uiSelector: uiSelector });
};
DBItemDropDownMultiSelector.props = (props) => {
    return {
        itemRenderer: (itemId, onDelete) => {
            const dbItem = props.module.cache.unique(itemId);
            return props.itemRenderer(dbItem, onDelete);
        },
        selectionRenderer: DBItemDropDownMultiSelector.selector(props.uiSelector)
    };
};
exports.DBItemDropDownMultiSelector = DBItemDropDownMultiSelector;
//# sourceMappingURL=DBItemDropDownMultiSelector.js.map