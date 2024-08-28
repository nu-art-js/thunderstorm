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
import {
	_className,
	ComponentSync,
	Grid,
	LL_H_C,
	LL_V_C,
	TS_BusyButton,
	TS_PropRenderer
} from '@thunder-storm/core/frontend';
import {_keys, addItemToArray, filterInstances} from '@thunder-storm/common';
import {
	Account_RegisterAccount,
	AccountEmail,
	assertPasswordRules,
	PasswordAssertionConfig,
	PasswordAssertionType,
	PasswordAssertionType_LowerCaseLetters,
	PasswordAssertionType_MaxLength,
	PasswordAssertionType_MinLength,
	PasswordAssertionType_Numbers,
	PasswordAssertionType_SpecialChars,
	PasswordFailureReport,
	PasswordWithCheck,
	Request_RegisterAccount
} from '../../shared';
import {ModuleFE_Account, StorageKey_DeviceId} from '../_entity';
import {TS_Icons} from '@thunder-storm/styles';
import {TS_InputV2} from '@thunder-storm/core/frontend/components/TS_V2_Input';

type State<T> = {
	data: Partial<T>
	errorMessages?: string[];
	renderPasswordRules: boolean;
	passwordFailureReport?: PasswordFailureReport;
	passwordAssertionConfig?: PasswordAssertionConfig;
	submitting: boolean
}
type Props<T> = {
	validate?: (data: Partial<T>) => string | undefined
	renderPasswordRules?: boolean;
}

type InputField = {
	type: 'text' | 'number' | 'password'
	label: string
	className?: string
	hint?: string
}

type Form<T> = { [K in keyof T]: InputField }

const form: Form<AccountEmail & PasswordWithCheck> = {
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
	passwordCheck: {
		type: 'password',
		hint: '****',
		label: 'Password Check',
	},
};

export class Component_Register
	extends ComponentSync<Props<Request_RegisterAccount>, State<Request_RegisterAccount>> {

	// ######################### Lifecycle #########################

	protected deriveStateFromProps(nextProps: Props<Request_RegisterAccount>, state: State<Request_RegisterAccount>) {
		state.data ??= {};
		state.renderPasswordRules = nextProps.renderPasswordRules ?? false;
		if (state.renderPasswordRules) {
			state.passwordAssertionConfig = ModuleFE_Account.getPasswordAssertionConfig();
			state.passwordFailureReport = assertPasswordRules(state.data.password ?? '', state.passwordAssertionConfig);
		}
		return state;
	}

	// ######################### Logic #########################

	private getPasswordRuleText = (key: PasswordAssertionType) => {
		const amount = this.state.passwordAssertionConfig?.[key]!;
		switch (key) {
			case PasswordAssertionType_LowerCaseLetters:
				return `At least ${amount} lower case letters`;
			case 'capital-letters':
				return `At least ${amount} capital letters`;
			case PasswordAssertionType_MaxLength:
				return `No more than ${amount} characters`;
			case PasswordAssertionType_MinLength:
				return `At least ${amount} characters`;
			case PasswordAssertionType_Numbers:
				return `At least ${amount} numbers`;
			case PasswordAssertionType_SpecialChars:
				return `At least ${amount} special characters`;
		}
	};

	private onValueChanged = (value: string, id: keyof Account_RegisterAccount['request'], onAccept: boolean = false) => {
		const data = {...this.state.data};
		data[id] = value;
		if (id !== 'password')
			return this.setState({data, errorMessages: undefined}, () => this.defaultFormStateUpdateCallback(onAccept));

		const passwordFailureReport = assertPasswordRules(value, this.state.passwordAssertionConfig);
		this.setState({
			data,
			errorMessages: undefined,
			passwordFailureReport
		}, () => this.defaultFormStateUpdateCallback(onAccept));
	};

	private defaultFormStateUpdateCallback = (onAccept: boolean) => {
		if (!onAccept)
			return;

		if (!this.canSubmit())
			return;

		this.setState({submitting: true}, async () => {
			await this.registerClicked();
			this.setState({submitting: false});
		});
	};

	private canSubmit = () => {
		if (this.state.passwordFailureReport)
			return;

		const data: Partial<Request_RegisterAccount> = this.state.data;
		const errors = filterInstances(_keys(form).map(key => {
			const field = form[key];
			return data[key] ? undefined : `missing ${field.label}`;
		}));

		const validateError = this.props.validate && this.props.validate(data);
		if (validateError)
			addItemToArray(errors, validateError);

		if (errors.length > 0) {
			this.setState({errorMessages: errors});
			return false;
		}

		return true;
	};

	private registerClicked = async () => {
		if (!this.canSubmit())
			return;

		try {
			await ModuleFE_Account._v1.registerAccount({
				...this.state.data,
				deviceId: StorageKey_DeviceId.get()
			} as Request_RegisterAccount).executeSync();
		} catch (_err: any) {
			const err = _err as Error;
			this.setState({errorMessages: [err.message]});
		}
	};

	// ######################### Render #########################

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
							onChange={(data) => this.onValueChanged(data, key)}
							onAccept={(data) => this.onValueChanged(data, key, true)}
						/>
						{key === 'password' && this.renderPasswordRules()}
					</TS_PropRenderer.Vertical>;
				}
			)}
			{this.renderErrorMessages()}
			<TS_BusyButton
				onClick={this.registerClicked}
				isBusy={this.state.submitting}
				className={`clickable ts-account__action-button`}
				disabled={!!this.state.passwordFailureReport}
			>Register</TS_BusyButton>
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

	private renderPasswordRules = () => {
		if (!this.state.renderPasswordRules || !this.state.data.password)
			return;

		const assertionKeys = _keys(this.state.passwordAssertionConfig ?? {});
		if (!assertionKeys.length)
			return;

		return <Grid className={'ts-account__authenticate__password-rules'}>
			{assertionKeys.map(assertionKey => {
				const isFulfilled = !this.state.passwordFailureReport?.[assertionKey];
				const className = _className('ts-account__authenticate__password-rule', isFulfilled && 'valid');
				return <LL_H_C className={className}>
					{isFulfilled ? <TS_Icons.v.component/> : <TS_Icons.x.component/>}
					{this.getPasswordRuleText(assertionKey)}
				</LL_H_C>;
			})}
		</Grid>;
	};
}
