import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { _keys } from '@nu-art/ts-common';
export class Component_Form extends React.Component {
    constructor(p) {
        super(p);
        this.state = { value: p.value };
    }
    render() {
        const data = this.state.value;
        return (_jsx("div", { className: `ll_v_c ${this.props.className}`, style: { justifyContent: 'space-evenly' }, children: _keys(this.props.form).map(key => this.renderField(data, key)) }));
    }
    renderField(data, key) {
        const field = this.props.form[key];
        const fieldProps = {
            key,
            field,
            value: data[key],
            onChange: this.onValueChanged,
            showErrors: this.props.showErrors,
            validator: this.props.validator?.[key],
            onAccept: () => {
                this.props.onAccept(this.state.value);
            },
        };
        return this.props.renderer[key](fieldProps);
    }
    onValueChanged = (value, id) => {
        this.setState(state => {
            state.value[id] = value;
            return state;
        });
    };
}
//# sourceMappingURL=Form.js.map