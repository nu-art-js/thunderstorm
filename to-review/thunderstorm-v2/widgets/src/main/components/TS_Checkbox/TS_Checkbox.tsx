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
import {HTMLProps} from 'react';
import {ComponentSync} from '../../core/ComponentSync.js';
import {_className} from '@nu-art/thunder-core';
import './TS_Checkbox.scss';
import {ComponentProps_Error} from '../types.js';

export type TemplatingProps_TS_Checkbox = ComponentProps_Error & Omit<HTMLProps<HTMLDivElement>, 'ref'> & {
	disabled?: boolean;
	rounded?: boolean;
	checked?: boolean;
	icon?: React.ReactNode;
};
export type Props_Checkbox = TemplatingProps_TS_Checkbox & React.PropsWithChildren<{
	id?: string;
	onCheck?: (checked: boolean, e: React.MouseEvent<HTMLDivElement>) => void;
}>;
type State_Checkbox = {
	checked: boolean;
	disabled?: boolean;
	className?: string;
};

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

	protected deriveStateFromProps(nextProps: Props_Checkbox, state: State_Checkbox) {
		state.checked = nextProps.checked ?? false;
		state.disabled = nextProps.disabled;
		state.className = nextProps.className;
		return state;
	}

	private onCheckboxClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		if (this.state.disabled)
			return;
		this.props.onCheck?.(!this.state.checked, e);
	};

	render() {
		const checkedClass = this.state.checked && 'ts-checkbox__button__checked' || 'ts-checkbox__button__unchecked';
		const disabledClass = this.state.disabled && 'ts-checkbox__button__disabled';
		const roundedClass = this.props.rounded && 'ts-checkbox__button__rounded';
		const className = _className('ts-checkbox__button', disabledClass, checkedClass, roundedClass);
		const innerClassName = _className('ts-checkbox__button__inner', disabledClass, checkedClass, roundedClass);
		return <div className={_className('ts-checkbox', this.state.className, this.state.disabled && 'ts-checkbox__disabled')} onClick={this.onCheckboxClick}>
			<div id={this.props.id} className={className}>
				{this.props.icon ? this.props.icon : <div className={innerClassName}/>}
			</div>
			{this.props.children && <div className="ts-checkbox__content">{this.props.children}</div>}
		</div>;
	}
}
