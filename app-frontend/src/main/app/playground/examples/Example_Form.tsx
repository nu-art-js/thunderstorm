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

import {Form, Form_FieldProps, FormRenderer, ModuleFE_Toaster, TS_Input} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import {Request_CreateAccount} from '@nu-art/user-account/shared/api';
import {COLORS} from '@res/colors';
import {ICONS} from '@res/icons';
import {renderForm} from '../../themes/forms';
import {__stringify} from '@nu-art/ts-common';


const renderer = (icon: React.ReactNode, props: Form_FieldProps<Request_CreateAccount, any>) => {
	const field = props.field;
	return <div className={`ll_h_c`} style={{
		borderBottom: `1px solid ${COLORS.gold()}`,
		marginBottom: '30px',
		width: '220px',
	}}>
		{icon}
		<TS_Input
			id={props.key}
			value={props.value}
			type={field.type}
			placeholder={field?.hint}
			onChange={props.onChange}
			onAccept={props.onAccept}
		/>
	</div>;
};

const formRenderer: FormRenderer<Request_CreateAccount> = {
	email: (props: Form_FieldProps<Request_CreateAccount, 'email'>) => {
		return renderer(ICONS.avatar(), props);
	},
	password: (props: Form_FieldProps<Request_CreateAccount, 'password'>) => {
		return renderer(ICONS.lock(), props);
	},
	password_check: (props: Form_FieldProps<Request_CreateAccount, 'password_check'>) => {
		return renderer(ICONS.lock(), props);
	},
};

const form: Form<Request_CreateAccount> = {
	email: {
		type: 'text',
		hint: 'email',
		label: 'Email',
	},
	password: {
		type: 'password',
		hint: '****',
		label: 'Password',
	},
	password_check: {
		type: 'password',
		hint: '****',
		label: 'Password Check',
	},
};

const initialValue: Partial<Request_CreateAccount> = {email: 'zevel@ashpa.pah'};
const onAccept = (value: Request_CreateAccount) => ModuleFE_Toaster.toastInfo(__stringify(value));
const onCancel = () => ModuleFE_Toaster.toastInfo('CANCELED');

export const Example_Form_Renderer = () => {
	return renderForm<Request_CreateAccount>({value: initialValue, renderer: formRenderer, form: form, onAccept, onCancel});
};

export const Example_Form = {renderer: Example_Form_Renderer, name: 'Form - Register'};