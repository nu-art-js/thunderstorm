"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorRenderer_BaseImpl = exports.throwValidationException = void 0;
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
const React = require("react");
const Item_Editor_1 = require("./Item_Editor");
function throwValidationException(err) {
    new frontend_1.ToastBuilder().setContent(React.createElement("div", null,
        React.createElement("span", { className: 'toast-text' }, `Missing Fields: ${(0, ts_common_1._keys)(err.result).map((item) => (0, ts_common_1.capitalizeFirstLetter)(item)).join(', ')}`))).setDuration(4000).show();
}
exports.throwValidationException = throwValidationException;
class EditorRenderer_BaseImpl extends Item_Editor_1.Item_Editor {
    deriveStateFromProps(nextProps, state) {
        state = {};
        state.isInEditMode = nextProps === null || nextProps === void 0 ? void 0 : nextProps.isInEditMode;
        state.creationMode = nextProps === null || nextProps === void 0 ? void 0 : nextProps.creationMode;
        return super.deriveStateFromProps(nextProps, state);
    }
    creationMode() {
        return !!this.props.creationMode;
    }
    editMode() {
        return !!this.props.isInEditMode;
    }
}
exports.EditorRenderer_BaseImpl = EditorRenderer_BaseImpl;
//# sourceMappingURL=EditorRenderer_BaseImpl.js.map