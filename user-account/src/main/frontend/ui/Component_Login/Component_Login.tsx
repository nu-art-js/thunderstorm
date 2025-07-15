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

import {_keys, exists, formatTimestamp} from '@nu-art/ts-common';
import {Account_Login, AccountEmail, AccountPassword, ErrorType_LoginBlocked} from '../../../shared';
import './Component_Login.scss';
import {Button, ComponentSync, LL_H_C, LL_V_C, ModuleFE_Toaster, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_Account, StorageKey_DeviceId} from '../../_entity';
import {TS_InputV2} from '@nu-art/thunderstorm/frontend/components/TS_V2_Input';
import {Component_LoginBlocked} from '../Component_LoginBlocked/Component_LoginBlocked';

type State<T> = {
	data: Partial<T>
	errorMessages?: string[];
	blockedUntil?: number;
	submitting: boolean
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

	//######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props, state: State<Account_Login['request']>) {
		state.data ??= {};
		return state;
	}

	//######################### Logic #########################

	private loginDataValid = () => {
		const data: Partial<Account_Login['request']> = this.state.data;
		const errors = _keys(form).map(key => {
			const field = form[key];
			return data[key] ? undefined : `  * missing ${field.label}`;
		}).filter(error => !!error);

		if (errors.length > 0) {
			ModuleFE_Toaster.toastError(`Wrong input:\n${errors.join('\n')}`);
			return false;
		}

		return true;
	};

	private login = async () => {
		//Fail fast if already submitted login
		if (this.state.submitting)
			return;

		//Fail fast if login is blocked
		if (exists(this.state.blockedUntil))
			return;

		//Fail fast if login data is not valid
		if (!this.loginDataValid())
			return;

		this.setState({submitting: true, errorMessages: undefined}, async () => {
			try {
				await ModuleFE_Account._v1.login({...this.state.data, deviceId: StorageKey_DeviceId.get()} as Account_Login['request'])
					.executeSync();
				this.setState({submitting: false});
			} catch (err: any) {
				if (err.errorResponse.error?.type === ErrorType_LoginBlocked) {
					const blockedUntil = err.errorResponse.error.data.blockedUntil;
					return this.setState({
						blockedUntil: blockedUntil,
						errorMessages: [`Login blocked until ${formatTimestamp('DD/MM/YYYY HH:mm', blockedUntil)}`],
					});
				}
				this.setState({errorMessages: ['Email or password incorrect'],submitting: false});
			}
		});
	};

	private onValueChanged = (value: string, id: keyof Account_Login['request'], isAccept: boolean = false) => {
		const data = {...this.state.data};
		data[id] = value;
		this.setState({data, errorMessages: undefined}, () => {
			if (isAccept)
				this.login();
		});
	};

	//######################### Render #########################

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
							allowAccept={true}
							onChange={(value) => {
								this.onValueChanged(value, key as keyof Account_Login['request']);
							}}
							onAccept={(value) => {
								this.onValueChanged(value, key as keyof Account_Login['request'], true);
							}}
						/>
					</TS_PropRenderer.Vertical>;
				}
			)}
			<LL_H_C className={'ts-account__error-container'}>
				{this.errorRenderer()}
			</LL_H_C>
			<Button
				variant={'tertiary'}
				className={`ts-account__action-button`}
				actionInProgress={this.state.submitting}
				disabled={exists(this.state.blockedUntil)}
				onClick={this.login}
			>Login</Button>
		</LL_V_C>;
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

	private renderAccountBlockedTimer = () => {
		if (!exists(this.state.blockedUntil)) return;

		return <Component_LoginBlocked
			hide={() => this.setState({blockedUntil: undefined})}
			blockedUntil={this.state.blockedUntil}
		/>;
	};

	private errorRenderer = () => {
		if (!this.state.errorMessages && !this.state.blockedUntil)
			return;

		if (this.state.blockedUntil)
			return this.renderAccountBlockedTimer();

		return this.renderErrorMessages();
	};
}
