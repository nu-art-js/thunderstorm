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
exports.FrameLayout = void 0;
const react_1 = require("react");
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const React = require("react");
require("./FrameLayout.scss");
class FrameLayout extends react_1.Component {
    render() {
        const _a = this.props, { children } = _a, props = __rest(_a, ["children"]);
        return React.createElement("div", Object.assign({}, props, { className: (0, frontend_1._className)(props.className, 'frame-layout') }), children);
    }
}
exports.FrameLayout = FrameLayout;
//# sourceMappingURL=FrameLayout.js.map