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

import * as React from "react";
import {Component, ReactNode} from "react";
import {TS_Checkbox} from "./TS_Checkbox";
import {toggleElementInArray} from "@nu-art/ts-common";

export type CheckboxOption<T> = {
    value: T
    checked?: boolean
    disabled?: boolean
}

type LabelType = ReactNode | ((checked: boolean, disabled: boolean) => ReactNode)

export type CheckboxFieldProps<T> = {
    id?: string
    options: CheckboxOption<T>[]
    label: (option: CheckboxOption<T>) => LabelType
    singleValue?: boolean
    circle?: boolean
    rtl?: boolean
    onFieldChange?: (value: T | T[]) => void
    fieldContainerClass?: string
    gridColumns?: number
    horizontal?: boolean
    buttonClass?: (checked: boolean, disabled: boolean) => string
    checkboxContainerClass?: (checked: boolean, disabled: boolean) => string
    innerNode?: (checked: boolean, disabled: boolean) => ReactNode
}

type State<T> = {
    value?: T | T[]
}

export class TS_CheckboxField<T>
    extends Component<CheckboxFieldProps<T>, State<T>> {

    initState = () => {
        if (this.props.singleValue)
            return {value: this.props.options.find(option => option.checked)?.value};

        const value: T[] = [];
        this.props.options.forEach(option => {
            if (option.checked)
                value.push(option.value)
        })
        return {value}
    }

    state = this.initState()

    gridCss = (): React.CSSProperties => {
        if (this.props.gridColumns)
            return {display: "grid",
                gridAutoFlow: this.props.horizontal ? "unset" : "column",
                gridGap: "1px",
                gridTemplateColumns: `repeat(${this.props.gridColumns}, 1fr)`,
                gridTemplateRows: `repeat(${Math.ceil(this.props.options.length/this.props.gridColumns)}, auto)`
            }
        return {}
    }

    render() {
        return <div className={`${this.props.fieldContainerClass} ${this.props.horizontal && !this.props.gridColumns ? 'll_h_c' : ''}`} style={this.gridCss()}>
            {this.props.options.map((option, i: number) =>
                <TS_Checkbox
                    key={i}
                    value={option.value}
                    checked={Array.isArray(this.state.value) ? this.state.value.includes(option.value) : this.state.value === option.value}
                    onCheck={(value: T) => {
                        this.setState(prev => {
                            if (this.props.singleValue)
                                return {value}
                            toggleElementInArray(prev.value as T[], value);
                            return {value: prev.value}
                        }, ()=> this.props.onFieldChange && this.props.onFieldChange(this.state.value as T | T[]));
                    }}
                    label={this.props.label(option)}
                    circle={this.props.circle}
                    rtl={this.props.rtl}
                    disabled={option.disabled}
                    buttonClass={this.props.buttonClass}
                    containerClass={this.props.checkboxContainerClass}
                    innerNode={this.props.innerNode}
                />
            )}
        </div>;
    }

}