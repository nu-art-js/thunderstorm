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
import {_keys} from '@nu-art/ts-common';
import {ModuleFE_Account} from '../../modules/ModuleFE_Account';
import {Request_LoginAccount} from '../../../shared/api';
import './Component_Login.scss';
import {ComponentSync, LL_V_C, ModuleFE_Toaster, TS_BusyButton, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';


type State<T> = {
	data: Partial<T>
	errorMessages?: string[];
}

type Props = {}

type InputField = {
	label: string
	hint: string
	type: 'text' | 'number' | 'password'
}

type Form<T> = { [K in keyof T]: InputField }

const form: Form<Request_LoginAccount> = {
	email: {
		type: 'text',
		hint: 'email',
		label: 'Email',
	},
	password: {
		type: 'password',
		hint: '****',
		label: 'Password',
	}
};

export class Component_Login
	extends ComponentSync<Props, State<Request_LoginAccount>> {

	protected deriveStateFromProps(nextProps: Props, state: State<Request_LoginAccount>) {
		state ??= this.state ? {...this.state} : {} as State<Request_LoginAccount>;
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
							onAccept={this.loginClicked}
						/>
					</TS_PropRenderer.Vertical>;
				}
			)}
			{this.renderErrorMessages()}
			<TS_BusyButton onClick={this.loginClicked} className={`clickable ts-account__action-button`}>Login</TS_BusyButton>
		</LL_V_C>;
	}

	private onValueChanged = (value: string, id: keyof Request_LoginAccount) => {
		const data = {...this.state.data};
		data[id] = value;
		this.setState({data, errorMessages: undefined});
	};

	private loginClicked = async () => {
		const data: Partial<Request_LoginAccount> = this.state.data;
		const errors = _keys(form).map(key => {
			const field = form[key];
			return data[key] ? undefined : `  * missing ${field.label}`;
		}).filter(error => !!error);

		// const validateError = this.props.validate(data);
		// if (validateError)
		// 	addItemToArray(errors, validateError);

		if (errors.length > 0)
			return ModuleFE_Toaster.toastError(`Wrong input:\n${errors.join('\n')}`);

		try {
			await ModuleFE_Account.v1.login(this.state.data as Request_LoginAccount).executeSync();
		} catch (err) {
			this.setState({errorMessages: ['Email or password incorrect']});
		}
	};
}
