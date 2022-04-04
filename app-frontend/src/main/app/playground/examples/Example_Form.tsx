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
	Form,
	Form_FieldProps,
	TS_Input,
	FormRenderer,
	ToastModule
} from "@nu-art/thunderstorm/frontend";
import * as React from "react";
import {Request_CreateAccount} from "@nu-art/user-account/shared/api";
import {css} from "emotion";
import {COLORS} from "@res/colors";
import {ICONS} from "@res/icons";
import {renderForm} from "../../themes/forms";
import {__stringify} from "@nu-art/ts-common";

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


const renderer = (icon: React.ReactNode, props: Form_FieldProps<Request_CreateAccount, any>) => {
	const field = props.field;
	return <div className={`ll_h_c ${fieldStyle}`}>
		{icon}
		<TS_Input
			id={props.key}
			value={props.value}
			type={field.type}
			placeholder={field?.hint}
			onChange={props.onChange}
			onAccept={props.onAccept}
		/>
	</div>
};

const formRenderer: FormRenderer<Request_CreateAccount> = {
	email: (props: Form_FieldProps<Request_CreateAccount, "email">) => {
		return renderer(ICONS.avatar(COLORS.gold(), 18), props);
	},
	password: (props: Form_FieldProps<Request_CreateAccount, "password">) => {
		return renderer(ICONS.lock(COLORS.gold(), 18), props);
	},
	password_check: (props: Form_FieldProps<Request_CreateAccount, "password_check">) => {
		return renderer(ICONS.lock(COLORS.gold(), 18), props);
	},
}

const form: Form<Request_CreateAccount> = {
	email: {
		className: fieldStyle,
		type: "text",
		hint: "email",
		label: "Email",
	},
	password: {
		className: fieldStyle,
		type: "password",
		hint: "****",
		label: "Password",
	},
	password_check: {
		className: fieldStyle,
		type: "password",
		hint: "****",
		label: "Password Check",
	},
};

const initialValue: Partial<Request_CreateAccount> = {email: "zevel@ashpa.pah"}
const onAccept = (value: Request_CreateAccount) => ToastModule.toastInfo(__stringify(value));
const onCancel = () => ToastModule.toastInfo("CANCELED");

export const Example_Form = () => {
	return renderForm<Request_CreateAccount>({value: initialValue, renderer: formRenderer, form: form, onAccept, onCancel})
};