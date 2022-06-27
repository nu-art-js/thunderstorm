/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';
import './TS_Checkbox.scss';


export type Props_Checkbox = {
	id?: string
	disabled?: boolean
	rounded?: boolean
	checked?: boolean
	onCheck?: (checked: boolean, e: React.MouseEvent<HTMLDivElement>) => void
}

type State_Checkbox = {
	checked: boolean
}

/**
 * Checkbox made simple..
 *
 * <b>SCSS:</b>
 * ```scss
 * .ts-checkbox ts-checkbox__checked/ts-checkbox__unchecked ts-checkbox__disabled ts-checkbox__rounded {
 * 	 .ts-checkbox__inner ts-checkbox__checked/ts-checkbox__unchecked ts-checkbox__disabled ts-checkbox__rounded {
 *
 * 	 }
 * }
 * ```
 */
export class TS_Checkbox
	extends ComponentSync<Props_Checkbox, State_Checkbox> {

	constructor(p: Props_Checkbox) {
		super(p);
	}

	protected deriveStateFromProps(nextProps: Props_Checkbox): State_Checkbox | undefined {
		return {checked: nextProps.checked || false};
	}

	render() {
		let onClick: undefined | ((checked: boolean, e: React.MouseEvent<HTMLDivElement>) => void);
		if (!this.props.disabled)
			onClick = this.props.onCheck;

		const checkedClass = this.props.checked && 'ts-checkbox__checked' || 'ts-checkbox__unchecked';
		const disabledClass = this.props.disabled && 'ts-checkbox__disabled';
		const roundedClass = this.props.rounded && 'ts-checkbox__rounded';
		const className = _className('ts-checkbox', disabledClass, checkedClass, roundedClass);
		const innerClassName = _className('ts-checkbox__inner', disabledClass, checkedClass, roundedClass);

		return <div
			id={this.props.id}
			className={className}
			onClick={!this.props.disabled ? (e) => onClick?.(!this.props.checked, e) : undefined}>
			<div className={innerClassName}/>
		</div>;
	}
}
