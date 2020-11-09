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
import {css} from "emotion";
import {
    CheckboxFieldProps,
    CheckboxOption,
    TS_CheckboxField
} from "@nu-art/thunderstorm/frontend";
import {ChckbxOption, lessOptions, options, lessOptions2} from "./data";
import {deepClone, toggleElementInArray} from "@nu-art/ts-common";
import {ICONS} from "@res/icons";
import {Example_NewProps} from "@nu-art/thunderstorm/app-frontend/components/playground/Example_NewProps";

const container = css({
    width: '500px'
})
type State = {cb1: ChckbxOption[], cb2?: ChckbxOption, cb3: ChckbxOption[], cb4?: ChckbxOption, cb5: ChckbxOption[], cb6: ChckbxOption[]}

export class Example_CheckboxField
    extends React.Component<{}, State> {
    private _opts = deepClone(options);
    constructor(props:{}) {
        super(props);
        options[1].disabled = true;
        const cb1: ChckbxOption[] = [];
        this._opts.map(opt => {
            if (opt.value.value === "el4" || opt.value.value === "el7" || opt.value.value === "el8" || opt.value.value === "el14") {
                cb1.push(opt.value);
            }
            if (opt.value.value === "el2" || opt.value.value === "el4") {
                opt.disabled = true;
            }
            return opt;
        });
        this.state={
            cb1,
            cb3: [],
            cb5: [],
            cb6: []
        }
    }

    label = (option: CheckboxOption<ChckbxOption>) => {
        return (checked: boolean, disabled: boolean) => <div
            style={{color: disabled ? "grey" : "inherit",
            fontWeight: checked ? "bold" : "inherit"}}>{option.value.label}</div>
    }

    render() {
        const props1 = this.props1();
        const props2 = this.props2();
        const props3 = this.props3();
        const props4 = this.props4();
        const props5 = this.props5();
        const props6 = this.props6();
        return <>
            <Example_NewProps name={"Grid-column 4 cols, multiple, disabled options, button with image"} renderer={TS_CheckboxField} data={[props1]} showToggle={false}/>
            <div>you chose</div>
            <div>{this.state.cb1.map(opt=><span key={opt.label}>{opt.value},</span>)}</div>
            <div>in grid multiple choice</div>
            <hr/>
            <Example_NewProps name={"Grid-row 3 cols, single, disabled option, circle"} renderer={TS_CheckboxField} data={[props2]} showToggle={false}/>
            <div>you chose {this.state.cb2?.value} in grid single choice</div>
            <hr/>
            <Example_NewProps name={"no grid, horizontal and vertical"} renderer={TS_CheckboxField} data={[props3, props4]} showToggle={false}/>
            <hr/>
            <Example_NewProps name={"toggle between fields"} renderer={TS_CheckboxField} data={[props5, props6]}/>
        </>;
    }

    private props1 = (): CheckboxFieldProps<any> => ({
        options: this._opts,
        value: this.state.cb1,
        gridColumns: 4,
        label: this.label,
        innerNode: (checked => checked ?
            <div>{ICONS.successToast("blue", 13)}</div> :
            <div style={{width: 13, height: 13}}/>),
        onCheck: (item: ChckbxOption) => {
            this.setState(prev => {
                toggleElementInArray(prev.cb1, item);
                return {cb1: prev.cb1};
            })
        },
        fieldContainerClass: container
    });

    private props2 = (): CheckboxFieldProps<any> => ({
        options: options,
        value: this.state.cb2,
        circle: true,
        gridColumns: 3,
        horizontal: true,
        label: this.label,
        onCheck: (item: ChckbxOption) => {
            this.setState({cb2: item})
        },
        fieldContainerClass: container
    });

    private props3 = (): CheckboxFieldProps<any> => ({
        options: lessOptions,
        value: this.state.cb3,
        label: this.label,
        horizontal: true,
        onCheck: (item: ChckbxOption) => {
            this.setState((prev) => {
                toggleElementInArray(prev.cb3, item);
                return {cb3: prev.cb3};
            })
        },
    });

    private props4 = (): CheckboxFieldProps<any> => ({
        options: lessOptions,
        value: this.state.cb4,
        label: this.label,
        circle: true,
        onCheck: (item: ChckbxOption) => {
            this.setState({cb4: item})
        },
    });

    private props5 = (): CheckboxFieldProps<any> => ({
        options: lessOptions,
        value: this.state.cb5,
        label: this.label,
        horizontal: true,
        onCheck: (item: ChckbxOption) => {
            this.setState((prev) => {
                toggleElementInArray(prev.cb5, item);
                return {cb5: prev.cb5};
            })
        },
    });

    private props6 = (): CheckboxFieldProps<any> => ({
        options: lessOptions2,
        value: this.state.cb6,
        label: this.label,
        horizontal: true,
        onCheck: (item: ChckbxOption) => {
            this.setState((prev) => {
                toggleElementInArray(prev.cb6, item);
                return {cb6: prev.cb6};
            })
        },
    });
}