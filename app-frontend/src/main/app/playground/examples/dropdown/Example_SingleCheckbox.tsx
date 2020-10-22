import * as React from 'react';
import {TS_Checkbox} from '@nu-art/thunderstorm/frontend';
import {css} from 'emotion';
import {ICONS} from "@res/icons";

type State = {
    f1: boolean
    f2: boolean
    f3: boolean
    f4: boolean
}

export class Example_SingleCheckbox extends React.Component<{}, State> {
    state = {f1: false, f2: true, f3: true, f4: false};

    render() {
        return <>
            <TS_Checkbox
                id={'f1'}
                label={'checkbox field'}
                value={'sing with us!'}
                checked={this.state.f1}
                onCheck={() => this.setState((prev) => ({f1: !prev.f1}))}
            />
            <TS_Checkbox
                id={'f2'}
                label={'checkbox field'}
                value={'sing with us!'}
                circle
                rtl
                checked={this.state.f2}
                onCheck={() => this.setState((prev) => ({f2: !prev.f2}))}
            />
            <TS_Checkbox
                id={'f3'}
                label={'checkbox field'}
                value={'sing with us!'}
                checked={this.state.f3}
                disabled
                containerClass={(checked: boolean, disabled: boolean) => css({color: disabled ? "grey" : "inherit"})}
            />
            <TS_Checkbox
                id={'f4'}
                label={(checked: boolean) => <div style={checked ? {background: "lime"} : {}}>checkbox field</div>}
                value={'sing with us!'}
                checked={this.state.f4}
                onCheck={() => this.setState((prev) => ({f4: !prev.f4}))}
                buttonClass={(() => css({border: "2px solid red"}))}
                innerNode={(checked => checked ?
                    <div>{ICONS.successToast("blue", 18)}</div> :
                    <div style={{width: 18, height: 18}}/>)}
            />
        </>
    }
}