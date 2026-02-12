import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ComponentSync } from '@nu-art/thunder-widgets';
import { LL_V_L } from '@nu-art/thunder-widgets';
export class TS_AppTools_Default extends ComponentSync {
    static Route = {
        key: 'app-tools-default',
        path: '',
        index: true,
        Component: this,
    };
    deriveStateFromProps(nextProps, state) {
    }
    render() {
        return _jsxs(LL_V_L, { id: 'app-tools-default', children: [_jsx("div", { className: 'title', children: "Welcome To App Tools!" }), _jsx("div", { className: 'sub-title', children: "Pick a screen on the left to show" })] });
    }
}
//# sourceMappingURL=TS_AppTools_Default.js.map