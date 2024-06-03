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
import {Account_Login, AccountEmail, AccountPassword} from '../../../shared';
import './Component_Login.scss';
import {ComponentSync, LL_V_C, ModuleFE_Toaster, TS_BusyButton, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_Account, StorageKey_DeviceId} from '../../_entity';
import {TS_InputV2} from '@nu-art/thunderstorm/frontend/components/TS_V2_Input';

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

const form: Form<AccountEmail & AccountPassword> = {
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
	extends ComponentSync<Props, State<Account_Login['request']>> {

	protected deriveStateFromProps(nextProps: Props, state: State<Account_Login['request']>) {
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
						<TS_InputV2
							id={key}
							value={data[key]}
							type={field.type}
							onChange={(value, id) => {
								this.onValueChanged(value,id as keyof Account_Login['request'])
							}}
							onAccept={() => this.loginClicked()}
						/>
					</TS_PropRenderer.Vertical>;
				}
			)}
			{this.renderErrorMessages()}
			<TS_BusyButton onClick={this.loginClicked}
						   className={`clickable ts-account__action-button`}>Login</TS_BusyButton>
		</LL_V_C>;
	}

	private onValueChanged = (value: string, id: keyof Account_Login['request']) => {
		const data = {...this.state.data};
		data[id] = value;
		this.setState({data, errorMessages: undefined});
	};

	private loginClicked = async () => {
		const data: Partial<Account_Login['request']> = this.state.data;
		const errors = _keys(form).map(key => {
			const field = form[key];
			return data[key] ? undefined : `  * missing ${field.label}`;
		}).filter(error => !!error);

		// const validateError = this.props.validate(data);
		// if (validateError)
		// 	addItemToArray(errors, validateError);
		// this.logWarning('Login');
		if (errors.length > 0)
			return ModuleFE_Toaster.toastError(`Wrong input:\n${errors.join('\n')}`);
		// this.logWarning('No errors during login');

		try {
			// this.logWarning('Login network begins');
			await ModuleFE_Account._v1.login({...this.state.data, deviceId: StorageKey_DeviceId.get()} as Account_Login['request']).executeSync();
			// this.logWarning('Logged in');
		} catch (err) {
			// this.logWarning('Failed login network');
			this.setState({errorMessages: ['Email or password incorrect']});
		}
	};
}
