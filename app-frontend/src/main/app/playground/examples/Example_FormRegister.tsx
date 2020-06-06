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

import {
	BaseComponent,
	Form,
	Component_Form,
	ToastModule,
	Form_FieldProps,
	TS_Input
} from "@nu-art/thunderstorm/frontend";
import * as React from "react";
import {Request_CreateAccount} from "@nu-art/user-account/shared/api";
import {
	ObjectTS,
	__stringify,
	deepClone
} from "@nu-art/ts-common";
import {css} from "emotion";
import {COLORS} from "@res/colors";
import {ICONS} from "@res/icons";

const fieldStyle = css({
	                       borderBottom: `1px solid ${COLORS.gold()}`,
	                       marginBottom: "30px",
	                       width: "220px",
                       })


const inputStyle = css({
	                       backgroundColor: "inherit",
	                       paddingLeft: "10px",
	                       width: "87%",
	                       color: `${COLORS.blueGrey()}`,
	                       outline: "none"
                       });


let renderer = (icon: React.ReactNode, props: Form_FieldProps<Request_CreateAccount, any>) => {
	const field = props.field;
	return <div className={`ll_h_c ${fieldStyle}`}>
		{icon}
		<TS_Input
			id={props.key}
			value={props.value}
			type={field.type}
			className={inputStyle}
			placeholder={field?.hint}
			onChange={props.onChange}
			onAccept={props.onAccept}
		/>
	</div>
};

const form: Form<Request_CreateAccount> = {
	email: {
		renderer: (props: Form_FieldProps<Request_CreateAccount, "email">) => {
			return renderer(ICONS.avatar(COLORS.gold(), 18), props);
		},
		className: fieldStyle,
		type: "text",
		hint: "email",
		label: "Email",
	},
	password: {
		renderer: (props: Form_FieldProps<Request_CreateAccount, "password">) => {
			return renderer(ICONS.lock(COLORS.gold(), 18), props);
		},
		className: fieldStyle,
		type: "password",
		hint: "****",
		label: "Password",
	},
	password_check: {
		renderer: (props: Form_FieldProps<Request_CreateAccount, "password_check">) => {
			return renderer(ICONS.lock(COLORS.gold(), 18), props);
		},
		className: fieldStyle,
		type: "password",
		hint: "****",
		label: "Password Check",
	},
};

type Props<T extends ObjectTS> = { value: T, onAccept: (value: T) => void };
type State<T extends ObjectTS> = { value: T };

export class Example_FormRegister
	extends BaseComponent<Props<Request_CreateAccount>, State<Request_CreateAccount>> {

	constructor(p: Props<Request_CreateAccount>) {
		super(p);
		this.state = {value: deepClone(this.props.value || {})}
	}

	private onAccept = () => ToastModule.toastInfo(__stringify(this.state.value));
	private onCancel = () => ToastModule.toastInfo(__stringify(this.props.value));

	render() {
		return <div>
			<Component_Form form={form} value={this.state.value} onAccept={this.onAccept}/>
			<div onClick={this.onAccept}>Accept</div>
			<div onClick={this.onCancel}>Cancel</div>
		</div>
	}
}
