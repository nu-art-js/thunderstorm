"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultListRenderer = exports.Page_ItemsEditor = void 0;
const React = require("react");
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const EditableDBItem_1 = require("../../utils/EditableDBItem");
const SmartPage_1 = require("../SmartPage");
require("./Page_ItemsEditor.scss");
const FrameLayout_1 = require("../FrameLayout");
class Page_ItemsEditor extends SmartPage_1.SmartPage {
    constructor(p) {
        super(p);
        this.onSelected = (item) => {
            frontend_1.ModuleFE_RoutingV2.goToRoute(this.props.route, { _id: item._id });
            this.reDeriveState();
        };
    }
    async deriveStateFromProps(nextProps, state) {
        const selectedId = (0, frontend_1.getQueryParameter)('_id');
        this.logError(selectedId);
        if (selectedId === undefined)
            return state;
        if (selectedId === null)
            state.editable = this.createEditableItem({});
        else if (selectedId) {
            const item = this.props.module.cache.unique(selectedId);
            state.editable = this.createEditableItem(item);
        }
        return state;
    }
    createEditableItem(item) {
        return new EditableDBItem_1.EditableDBItem(Object.assign({}, item), this.props.module, this.onSelected).setAutoSave(true);
    }
    render() {
        var _a;
        const List = this.props.ListRenderer || DefaultListRenderer;
        const Editor = this.props.EditorRenderer;
        const sort = this.props.sort || ((item) => item.__created);
        return React.createElement(FrameLayout_1.FrameLayout, { className: "editor-page" },
            React.createElement(frontend_1.LL_H_T, { className: "editor-content match_parent margin__block" },
                React.createElement(List, { itemRenderer: this.props.itemRenderer, filter: this.props.filter, selected: (_a = this.state.editable) === null || _a === void 0 ? void 0 : _a.item, sort: sort, module: this.props.module, onSelected: this.onSelected }),
                React.createElement(frontend_1.TS_Space, { width: 1 }),
                this.state.editable && React.createElement("div", { className: "item-editor" },
                    React.createElement(Editor, { editable: this.state.editable }))),
            React.createElement(frontend_1.LL_VH_C, { className: "add-item clickable", onClick: () => {
                    this.onSelected({});
                } }, "+"));
    }
}
exports.Page_ItemsEditor = Page_ItemsEditor;
class DefaultListRenderer extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { filterText: '' };
    }
    render() {
        const items = this.props.filter.filterSort(this.props.module.cache
            .sort(this.props.sort), this.state.filterText);
        return React.createElement(frontend_1.LL_V_L, { className: "items-list match_height margin__inline" },
            React.createElement(frontend_1.TS_Input, { className: 'margin__bottom', placeholder: 'Type to Filter', type: 'text', onChange: value => this.setState({ filterText: value }) }),
            React.createElement(frontend_1.LL_V_L, { className: "flex__grow scrollable-y match_width" }, items.map(item => {
                var _a;
                return React.createElement("div", { key: item._id, className: (0, frontend_1._className)('match_width', 'list-item', item._id === ((_a = this.props.selected) === null || _a === void 0 ? void 0 : _a._id) && 'list-item__selected'), onClick: () => this.props.onSelected(item) }, this.props.itemRenderer(item));
            })));
    }
}
exports.DefaultListRenderer = DefaultListRenderer;
//# sourceMappingURL=Page_ItemsEditor.js.map