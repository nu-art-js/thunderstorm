/*
 * User secured registration and login management system..
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
import {_keys, addItemToArray, filterInstances} from '@nu-art/ts-common';
import {ModuleFE_Account} from '../modules/ModuleFE_Account';
import {Request_CreateAccount} from '../../shared/api';
import {ComponentSync, LL_V_C, TS_BusyButton, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';


type State<T> = {
	data: Partial<T>
	errorMessages?: string[];
}
type Props<T> = {
	validate?: (data: Partial<T>) => string | undefined
}

type InputField = {
	type: 'text' | 'number' | 'password'
	label: string
	className?: string
	hint?: string
}

type Form<T> = { [K in keyof T]: InputField }

const form: Form<Request_CreateAccount> = {
	email: {
		className: '',
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

export class Component_Register
	extends ComponentSync<Props<Request_CreateAccount>, State<Request_CreateAccount>> {

	protected deriveStateFromProps(nextProps: Props<Request_CreateAccount>, state: State<Request_CreateAccount>) {
		state ??= this.state ? {...this.state} : {} as State<Request_CreateAccount>;
		state.data ??= {};
		return state;
	}

	private renderErrorMessages = () => {
		if (!this.state.errorMessages?.length)
			return '';

		return <ul className={'ts-account__error-messages'}>
			{this.state.errorMessages.map((message, i) => {
				return <li key={i}>{message}</li>;
			})}
		</ul>;
	};

	render() {
		const data = this.state.data;
		return <LL_V_C className="ts-account__authenticate">
			{_keys(form).map((key, i) => {
					const field = form[key];
					return <TS_PropRenderer.Vertical label={field.label} key={i}>
						<TS_Input
							id={key}
							value={data[key]}
							type={field.type}
							onChange={this.onValueChanged}
							onAccept={this.registerClicked}
						/>
					</TS_PropRenderer.Vertical>;
				}
			)}
			{this.renderErrorMessages()}
			<TS_BusyButton onClick={this.registerClicked} className={`clickable ts-account__action-button`}>Register</TS_BusyButton>
		</LL_V_C>;
	}

	private onValueChanged = (value: string, id: keyof Request_CreateAccount) => {
		const data = {...this.state.data};
		data[id] = value;
		this.setState({data, errorMessages: undefined});
	};

	private registerClicked = async () => {
		const data: Partial<Request_CreateAccount> = this.state.data;
		const errors = filterInstances(_keys(form).map(key => {
			const field = form[key];
			return data[key] ? undefined : `missing ${field.label}`;
		}));

		const validateError = this.props.validate && this.props.validate(data);
		if (validateError)
			addItemToArray(errors, validateError);

		if (errors.length > 0)
			return this.setState({errorMessages: errors});

		try {
			await ModuleFE_Account.v1.create(this.state.data as Request_CreateAccount).executeSync();
		} catch (_err: any) {
			const err = _err as Error;
			this.setState({errorMessages: [err.message]});
		}
	};
}
