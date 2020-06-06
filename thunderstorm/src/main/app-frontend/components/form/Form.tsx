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

import {
	Form,
	Form_FieldProps
} from "./types";
import * as React from "react";
import {
	_keys,
	ObjectTS
} from "@nu-art/ts-common";

type Props<T extends object = object> = {
	form: Form<T>,
	value: T,
	onAccept: () => void;
	className?: string,
}

type State<T extends object = object> = { value: T };

export class Component_Form<T extends ObjectTS = ObjectTS>
	extends React.Component<Props<T>, State<T>> {

	state = {value: {} as T};

	constructor(p: Props<T>) {
		super(p);
		this.state = {value: p.value}
	}

	render() {
		const data = this.state.value;
		return (
			<div className={`ll_v_c ${this.props.className}`} style={{justifyContent: 'space-evenly'}}>
				{_keys(this.props.form).map(key => this.renderField(data, key))}
			</div>
		)
	}

	private renderField(data: T, key: keyof T) {
		const field = this.props.form[key];
		const fieldProps: Form_FieldProps<T> = {
			key,
			field,
			value: data[key],
			onChange: this.onValueChanged,
			onAccept: this.props.onAccept
		};
		return field.renderer(fieldProps)
	}

	private onValueChanged = (value: any, id: keyof T) => {
		this.setState(state => {
			state.value[id] = value;
			return state
		});
	};
}
