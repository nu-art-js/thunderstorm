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
import {Component, ReactNode} from 'react';
import {TS_CheckboxOLD} from './TS_Checkbox-OLD';

export type CheckboxOption<T> = {
	value: T
	disabled?: boolean
}

type LabelType = ReactNode | ((checked: boolean, disabled: boolean) => ReactNode)

export type CheckboxFieldProps<T> = {
	id?: string
	options: CheckboxOption<T>[]
	value: T | T[]
	label: (option: CheckboxOption<T>) => LabelType
	circle?: boolean
	rtl?: boolean
	onCheck: (value: T, checked: boolean) => void
	fieldContainerClass?: string
	gridColumns?: number
	horizontal?: boolean
	buttonClass?: (checked: boolean, disabled: boolean) => string
	checkboxContainerClass?: (checked: boolean, disabled: boolean) => string
	innerNode?: (checked: boolean, disabled: boolean) => ReactNode
}

export class TS_CheckboxFieldOLD<T>
	extends Component<CheckboxFieldProps<T>, {}> {

	gridCss = (): React.CSSProperties => {
		if (this.props.gridColumns)
			return {
				display: 'grid',
				gridAutoFlow: this.props.horizontal ? 'unset' : 'column',
				gridGap: '1px',
				gridTemplateColumns: `repeat(${this.props.gridColumns}, 1fr)`,
				gridTemplateRows: `repeat(${Math.ceil(this.props.options.length / this.props.gridColumns)}, auto)`
			};
		return {};
	};

	render() {
		return <div className={`${this.props.fieldContainerClass} ${this.props.horizontal && !this.props.gridColumns ? 'll_h_c' : ''}`} style={this.gridCss()}>
			{this.props.options.map((option, i: number) =>
				<TS_CheckboxOLD
					key={i}
					value={option.value}
					checked={Array.isArray(this.props.value) ? this.props.value.includes(option.value) : this.props.value === option.value}
					onCheck={this.props.onCheck}
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