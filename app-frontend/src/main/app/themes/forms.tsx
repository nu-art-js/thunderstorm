/*
 * A typescript & react boilerplate with api call example
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
import {
	BaseComponent,
	Component_Form,
	FormProps
} from "@nu-art/thunderstorm/frontend";
import {
	deepClone,
	ObjectTS
} from "@nu-art/ts-common";

type State<T extends ObjectTS> = {
	value: Partial<T>,
	showErrors: boolean
};
export type ConfirmationForm<T extends ObjectTS> = FormProps<T> & { onCancel: () => void }

class ConfirmationFormWrapper<T extends ObjectTS>
	extends BaseComponent<ConfirmationForm<T>, State<T>> {

	constructor(p: ConfirmationForm<T>) {
		super(p);
		this.state = {
			value: deepClone(this.props.value || {}),
			showErrors: false
		}
	}

	render() {
		return <div>
			<Component_Form {...this.props} value={this.state.value} onAccept={this.onAccept} showErrors={this.state.showErrors}/>

			<div className={"ll_h_c"} style={{marginTop: "10px"}}>
				<div onClick={this.onAccept}>Accept</div>
				<div onClick={this.props.onCancel}>Cancel</div>
			</div>
		</div>
	}

	onAccept = () => {
		this.props.onAccept(this.state.value as T);
	};
}

export function renderForm<T extends ObjectTS>(props: ConfirmationForm<T>) {
	return <ConfirmationFormWrapper {...props}/>
}
