"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Item_EditorController = exports.Item_Editor = void 0;
const React = require("react");
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
const EditableDBItem_1 = require("../../utils/EditableDBItem");
class Item_Editor extends frontend_1.ComponentSync {
    constructor() {
        super(...arguments);
        this.input = (prop, inputProps) => {
            const value = this.props.editable.item[prop];
            return {
                vertical: (label, props) => {
                    const _a = inputProps || {}, { readProcessor, writeProcessor, onBlur } = _a, restProps = __rest(_a, ["readProcessor", "writeProcessor", "onBlur"]);
                    return React.createElement(frontend_1.TS_PropRenderer.Vertical, Object.assign({ label: label }, props),
                        React.createElement(frontend_1.TS_Input, Object.assign({ type: "text", value: (readProcessor === null || readProcessor === void 0 ? void 0 : readProcessor(value)) || value, onBlur: value => {
                                onBlur ? onBlur(value) : this.props.editable.update(prop, (writeProcessor === null || writeProcessor === void 0 ? void 0 : writeProcessor(value)) || value);
                            } }, restProps)));
                },
                horizontal: (label, props) => {
                    const _a = inputProps || {}, { readProcessor, writeProcessor, onBlur } = _a, restProps = __rest(_a, ["readProcessor", "writeProcessor", "onBlur"]);
                    return React.createElement(frontend_1.TS_PropRenderer.Horizontal, Object.assign({ label: label }, props),
                        React.createElement(frontend_1.TS_Input, Object.assign({ type: "text", value: (readProcessor === null || readProcessor === void 0 ? void 0 : readProcessor(value)) || value, onBlur: value => {
                                onBlur ? onBlur(value) : this.props.editable.update(prop, (writeProcessor === null || writeProcessor === void 0 ? void 0 : writeProcessor(value)) || value);
                            } }, restProps)));
                }
            };
        };
        this.inputNumber = (prop, inputProps) => {
            const value = this.props.editable.item[prop];
            return {
                vertical: (label, props) => {
                    const _a = inputProps || {}, { readProcessor, writeProcessor, onBlur } = _a, restProps = __rest(_a, ["readProcessor", "writeProcessor", "onBlur"]);
                    return React.createElement(frontend_1.TS_PropRenderer.Vertical, Object.assign({ label: label }, props),
                        React.createElement(frontend_1.TS_Input, Object.assign({ type: "number", value: String((readProcessor === null || readProcessor === void 0 ? void 0 : readProcessor(value)) || value), onBlur: value => {
                                onBlur ? onBlur(value) : this.props.editable.update(prop, (writeProcessor === null || writeProcessor === void 0 ? void 0 : writeProcessor(+value)) || value);
                            } }, restProps)));
                },
                horizontal: (label, props) => {
                    const _a = inputProps || {}, { readProcessor, writeProcessor, onBlur } = _a, restProps = __rest(_a, ["readProcessor", "writeProcessor", "onBlur"]);
                    return React.createElement(frontend_1.TS_PropRenderer.Horizontal, Object.assign({ label: label }, props),
                        React.createElement(frontend_1.TS_Input, Object.assign({ type: "number", value: String((readProcessor === null || readProcessor === void 0 ? void 0 : readProcessor(value)) || value), onBlur: value => {
                                onBlur ? onBlur(value) : this.props.editable.update(prop, (writeProcessor === null || writeProcessor === void 0 ? void 0 : writeProcessor(+value)) || value);
                            } }, restProps)));
                }
            };
        };
        this.inputBoolean = (prop, inputProps) => {
            const value = this.props.editable.item[prop];
            return {
                vertical: (label, props) => {
                    const _a = inputProps || {}, { readProcessor, writeProcessor, onCheck } = _a, restProps = __rest(_a, ["readProcessor", "writeProcessor", "onCheck"]);
                    return React.createElement(frontend_1.TS_PropRenderer.Vertical, Object.assign({ label: label }, props),
                        React.createElement(frontend_1.TS_Checkbox, Object.assign({ checked: (readProcessor === null || readProcessor === void 0 ? void 0 : readProcessor(value)) || value, onCheck: value => {
                                onCheck ? onCheck(value) : this.props.editable.update(prop, (writeProcessor === null || writeProcessor === void 0 ? void 0 : writeProcessor(value)) || value);
                                this.forceUpdate();
                            } }, restProps)));
                },
                horizontal: (label, props) => {
                    const _a = inputProps || {}, { readProcessor, writeProcessor, onCheck } = _a, restProps = __rest(_a, ["readProcessor", "writeProcessor", "onCheck"]);
                    return React.createElement(frontend_1.TS_PropRenderer.Horizontal, Object.assign({ label: label }, props),
                        React.createElement(frontend_1.TS_Checkbox, Object.assign({ checked: (readProcessor === null || readProcessor === void 0 ? void 0 : readProcessor(value)) || value, onCheck: value => {
                                onCheck ? onCheck(value) : this.props.editable.update(prop, (writeProcessor === null || writeProcessor === void 0 ? void 0 : writeProcessor(value)) || value);
                                this.forceUpdate();
                            } }, restProps)));
                }
            };
        };
    }
    deriveStateFromProps(nextProps, state) {
        const _state = (state || {});
        _state.editable = nextProps.editable;
        return _state;
    }
}
exports.Item_Editor = Item_Editor;
class Item_EditorController extends frontend_1.ComponentSync {
    constructor(p) {
        super(p);
        this.__onItemUpdated = (...params) => {
            const items = (0, ts_common_1.asArray)(params[1]);
            if (!items.map(ts_common_1.dbObjectToId).includes(this.state.editable.item._id))
                return;
            return this.reDeriveState();
        };
        const method = p.module.defaultDispatcher.method;
        // @ts-ignore
        this[method] = this.__onItemUpdated;
    }
    deriveStateFromProps(nextProps, state) {
        const _state = (state || {});
        const item = typeof nextProps.item === 'string' ? nextProps.module.cache.unique(nextProps.item) : nextProps.item;
        _state.editable = new EditableDBItem_1.EditableDBItem(item, nextProps.module, async (item) => {
            var _a;
            this.setState(state => ({ editable: state.editable.clone(item) }));
            await ((_a = nextProps.onCompleted) === null || _a === void 0 ? void 0 : _a.call(nextProps, item));
        }, nextProps.onError).setAutoSave(nextProps.autoSave || false);
        return _state;
    }
    render() {
        return this.props.editor(this.state.editable);
    }
}
exports.Item_EditorController = Item_EditorController;
// type K = DB_Object &{ pah:{zevel:string[],zevel2:string,ashpa:{zevel3:string}[]}}
// class KEditor extends Item_Editor<K> {
// 	func() {
// 		this.props.editable.editProp("pah",{}).editProp("ashpa", []).update(0,{zevel3:""})
// 	}
// }
//# sourceMappingURL=Item_Editor.js.map