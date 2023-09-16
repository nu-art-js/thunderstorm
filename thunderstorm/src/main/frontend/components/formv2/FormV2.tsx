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

import {FormRendererV2, FormV2, ObjectProp} from './types';
import * as React from 'react';
import {_keys} from '@nu-art/ts-common';
import {EditableItem} from '../../utils/EditableItem';
import {EditableRef, State_ItemEditor} from '../Item_Editor';
import {ComponentSync} from '../../core';


export type Props_FormV2<Form extends FormV2<any>, EditingType extends Form['editingType'] = Form['editingType']> = {
	renderer: Partial<FormRendererV2<Form>>,
	className?: string,
	validator: Form['validator']
	onAccept: (value: EditingType) => void;
	showErrors: boolean
} & EditableRef<EditingType>

type State_FormV2<Form extends FormV2<any>> = EditableRef<Form['editingType']>;

export class Component_FormV2<Form extends FormV2<any>, EditingType extends Form['editingType'] = Form['editingType']>
	extends ComponentSync<Props_FormV2<Form>, State_FormV2<Form>> {
	static defaultProps = {
		showErrors: false
	};

	constructor(p: Props_FormV2<Form>) {
		super(p);
	}

	protected deriveStateFromProps(nextProps: Props_FormV2<Form>, state?: Partial<State_ItemEditor<Form>>): (State_ItemEditor<Form>) | undefined {
		const _state = (state || {}) as State_ItemEditor<Form>;
		_state.editable = nextProps.editable;
		return _state;
	}

	render() {
		return (
			<div className={`ll_v_c ${this.props.className}`} style={{justifyContent: 'space-evenly'}}>
				{_keys(this.props.renderer).map(key => this.renderField(this.state.editable, key))}
			</div>
		);
	}

	private renderField<K extends keyof EditingType>(editable: EditableItem<EditingType>, prop: K) {
		const fieldProps: ObjectProp<Form['properties'][K]> = {
			prop,
			value: editable.item[prop],
			onChange: (value: EditingType, prop: string) => editable.set(prop as K, value),
			showErrors: this.props.showErrors,
			onAccept: (value: EditingType, prop: string) => editable.update(prop as K, value),
			validator: this.props.validator?.[prop],
		};

		return this.props.renderer[prop](fieldProps);
	}
}
