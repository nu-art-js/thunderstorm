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
import {CheckboxOption, TS_CheckboxField} from "@nu-art/thunderstorm/app-frontend/components/checkbox/TS_CheckboxField";
import {options, ChckbxOption, lessOptions} from "./data";
import {deepClone} from "@nu-art/ts-common";
import {ICONS} from "@res/icons";

const container = css({
    width: '500px'
})

export class Example_CheckboxField
    extends React.Component<{}, {cb1: ChckbxOption[], cb2?: ChckbxOption}> {
    private _opts = deepClone(options);
    constructor(props:{}) {
        super(props);
        options[1].disabled = true;
        const cb1: ChckbxOption[] = [];
        this._opts.map(opt => {
            if (opt.value.value === "el4" || opt.value.value === "el7" || opt.value.value === "el8" || opt.value.value === "el14") {
                opt.checked = true;
                cb1.push(opt.value);
            }
            if (opt.value.value === "el2" || opt.value.value === "el4") {
                opt.disabled = true;
            }
            return opt;
        });
        this.state={
            cb1
        }
    }

    label = (option: CheckboxOption<ChckbxOption>) => {
        return (checked: boolean, disabled: boolean) => <div
            style={{color: disabled ? "grey" : "inherit",
            fontWeight: checked ? "bold" : "inherit"}}>{option.value.label}</div>
    }

    render() {
        return <>
            <TS_CheckboxField
                options={this._opts}
                gridColumns={4}
                label={this.label}
                innerNode={(checked => checked ?
                    <div>{ICONS.successToast("blue", 13)}</div> :
                    <div style={{width: 13, height: 13}}/>)}
                onFieldChange={cb1=> this.setState({cb1: cb1 as ChckbxOption[]})}
                fieldContainerClass={container}
            />
            <div>you chose</div>
            <div>{this.state.cb1.map(opt=><span key={opt.label}>{opt.value},</span>)}</div>
            <hr/>
            <TS_CheckboxField
                options={options}
                circle
                singleValue
                gridColumns={3}
                horizontal
                label={this.label}
                onFieldChange={cb2=> this.setState({cb2: cb2 as ChckbxOption})}
                fieldContainerClass={container}
            />
            <div>you chose {this.state.cb2?.value}</div>
            <hr/>
            <TS_CheckboxField options={lessOptions} label={this.label} horizontal/>
            <hr/>
            <TS_CheckboxField options={lessOptions} label={this.label} circle singleValue/>
        </>;
    }


}