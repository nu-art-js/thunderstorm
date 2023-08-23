"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericDropDown = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
const React = require("react");
// const defaultQueryFilter = () => true;
class GenericDropDown extends frontend_1.ComponentSync {
    deriveStateFromProps(nextProps) {
        var _a, _b, _c;
        const state = {};
        const items = ((_b = (_a = this.props).itemResolver) === null || _b === void 0 ? void 0 : _b.call(_a)) || nextProps.module.cache.allMutable();
        if (!nextProps.queryFilter)
            state.items = items;
        else {
            state.items = items.filter(nextProps.queryFilter);
            if (state.items.length === 0 && nextProps.ifNoneShowAll === true)
                state.items = items;
        }
        //Sort Items by sort function or object keys
        state.items = ((_c = nextProps.sortBy) === null || _c === void 0 ? void 0 : _c.reduce((toRet, sortBy) => {
            return (0, ts_common_1.sortArray)(state.items, typeof sortBy === 'function' ? sortBy : item => item[sortBy]);
        }, state.items)) || state.items;
        //Set selected item
        state.selected = this.getSelected(nextProps.module, nextProps.selected);
        state.filter = new ts_common_1.Filter(nextProps.mapper);
        state.adapter = (0, frontend_1.SimpleListAdapter)(state.items, props => nextProps.renderer(props.item));
        return state;
    }
    getSelected(module, selectMethod) {
        switch (typeof selectMethod) {
            case 'string':
                return module.cache.unique(selectMethod);
            case 'function':
                return selectMethod();
            case 'object':
                if (!Array.isArray(selectMethod))
                    return selectMethod;
        }
        return undefined;
    }
    render() {
        return React.createElement(frontend_1.TS_DropDown, { className: this.props.className, placeholder: this.props.placeholder || 'Choose one', inputValue: this.props.inputValue, adapter: this.state.adapter, filter: this.state.filter, selected: this.state.selected, onNoMatchingSelectionForString: this.props.onNoMatchingSelectionForString, onSelected: this.props.onSelected, caret: this.props.caret, boundingParentSelector: this.props.boundingParentSelector, renderSearch: this.props.renderSearch, limitItems: this.props.limitItems, canUnselect: this.props.canUnselect, disabled: this.props.disabled });
    }
}
exports.GenericDropDown = GenericDropDown;
//# sourceMappingURL=GenericDropDown.js.map