import { jsx as _jsx } from "react/jsx-runtime";
import { _keys } from '@nu-art/ts-common';
import { ComponentSync, TS_PropRenderer } from '@nu-art/thunder-widgets';
export class Component_FormV3 extends ComponentSync {
    static defaultProps = {};
    constructor(p) {
        super(p);
        this.state = { editable: p.editable };
    }
    deriveStateFromProps(nextProps, state) {
        state.editable = nextProps.editable;
        return state;
    }
    render() {
        const editable = this.state.editable;
        return (_jsx("div", { className: `ll_v_c ${this.props.className}`, style: { justifyContent: 'space-evenly' }, children: _keys(this.props.renderers).map(key => this.renderField(editable, key)) }));
    }
    renderField(editable, prop) {
        const renderer = this.props.renderers[prop];
        const Editor = renderer.editor;
        return (_jsx(TS_PropRenderer.Vertical, { label: renderer.label, children: _jsx(Editor, { editable: editable, prop: prop }) }, String(prop)));
    }
}
//# sourceMappingURL=FormV3.js.map