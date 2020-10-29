/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import {CheckboxProps, Example_NewProps, TS_Checkbox} from '@nu-art/thunderstorm/frontend';
import {css} from 'emotion';
import {ICONS} from "@res/icons";

type State = {
    f1: boolean
    f2: boolean
    f3: boolean
    f4: boolean
}

export class Example_SingleCheckbox
    extends React.Component<{}, State> {
    state = {f1: false, f2: true, f3: true, f4: false};

    render() {
        return <Example_NewProps name={"TS checkbox: regular, circle, disabled, image in button + css"} renderer={TS_Checkbox} data={[this.props1(), this.props2(),this.props3(),this.props4(),]} showToggle={false}/>
    }

    private props1 = (): CheckboxProps<any> => ({
        id: 'f1',
        label: 'checkbox field',
        value: 'sing with us!',
        checked: this.state.f1,
        onCheck: () => this.setState((prev) => ({f1: !prev.f1}))
    });
    private props2 = (): CheckboxProps<any> => ({
        id: 'f2',
        label: 'checkbox field',
        value: 'sing with us!',
        checked: this.state.f2,
        circle: true,
        rtl: true,
        onCheck: () => this.setState((prev) => ({f2: !prev.f2}))
    });
    private props3 = (): CheckboxProps<any> => ({
        id: 'f3',
        label: 'checkbox field',
        value: 'sing with us!',
        checked: this.state.f3,
        disabled: true,
        onCheck: () => this.setState((prev) => ({f3: !prev.f3}))
    });
    private props4 = (): CheckboxProps<any> => ({
        id: 'f4',
        label: 'checkbox field',
        value: 'sing with us!',
        checked: this.state.f4,
        onCheck: () => this.setState((prev) => ({f4: !prev.f4})),
        buttonClass: () => css({border: "2px solid red"}),
        innerNode: checked => checked ?
        <div>{ICONS.successToast("blue", 18)}</div> :
        <div style={{width: 18, height: 18}}/>
    });
}