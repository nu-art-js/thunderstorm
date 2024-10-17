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
import {ComponentType} from 'react';
import {_keys} from '@nu-art/ts-common';
import {EditableItem, UIProps_EditableItem} from '../../utils/EditableItem';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_PropRenderer} from '../TS_PropRenderer';
import {EditableRef} from '../TS_EditableContent/TS_EditableContent';


export type Props_FormV3<T> = {
	className?: string,
	editable: EditableItem<T>
	renderers: {
		[K in keyof T]?: {
			label: string
			editor: ComponentType<UIProps_EditableItem<any, any, T[K]>>
			//
		}
	}
}

type State_FormV3<T> = {
	editable: EditableItem<T>
};

export class Component_FormV3<T>
	extends ComponentSync<Props_FormV3<T>, State_FormV3<T>> {
	static defaultProps = {};

	constructor(p: Props_FormV3<T>) {
		super(p);
	}

	protected deriveStateFromProps(nextProps: Props_FormV3<T>, state?: Partial<EditableRef<T>>): (EditableRef<T>) {
		const _state = (state || {}) as EditableRef<T>;
		_state.editable = nextProps.editable;
		return _state;
	}

	render() {
		return (
			<div className={`ll_v_c ${this.props.className}`} style={{justifyContent: 'space-evenly'}}>
				{_keys(this.props.renderers).map(key => this.renderField(this.state.editable, key))}
			</div>
		);
	}

	private renderField<K extends keyof T>(editable: EditableItem<T>, prop: K) {
		const renderer = this.props.renderers[prop]!;
		const Editor = renderer.editor;
		return <TS_PropRenderer.Vertical label={renderer.label}>
			<Editor editable={editable} prop={prop}/>
		</TS_PropRenderer.Vertical>;
	}
}
