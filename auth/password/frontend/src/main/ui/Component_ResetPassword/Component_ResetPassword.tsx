/*!
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

import {_keys} from '@nu-art/ts-common';
import {Button, ComponentSync, LL_H_C, LL_V_C, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {Label, TS_Input} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_PasswordAuth} from '../../ModuleFE_PasswordAuth.js';
import './Component_ResetPassword.scss';

type Props = {
	token: string;
	onSuccess?: () => void;
};

type ResetData = {
	password: string;
	passwordCheck: string;
};

type State = {
	data: Partial<ResetData>;
	errorMessages?: string[];
	submitting: boolean;
	success: boolean;
};

type InputField = {
	label: string;
	type: 'password';
};

const form: { [K in keyof ResetData]: InputField } = {
	password: {type: 'password', label: 'New Password'},
	passwordCheck: {type: 'password', label: 'Confirm Password'},
};

export class Component_ResetPassword
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.data ??= {};
		state.success ??= false;
		return state;
	}

	private resetDataValid = () => {
		const data: Partial<ResetData> = this.state.data;
		const errors = _keys(form)
			.map(key => data[key] ? undefined : `  * missing ${form[key].label}`)
			.filter(error => !!error) as string[];

		if (data.password && data.passwordCheck && data.password !== data.passwordCheck)
			errors.push('  * Passwords do not match');

		if (errors.length > 0) {
			this.setState({errorMessages: errors});
			return false;
		}

		return true;
	};

	private reset = async () => {
		if (this.state.submitting)
			return;

		if (!this.resetDataValid())
			return;

		this.setState({submitting: true, errorMessages: undefined}, async () => {
			try {
				await ModuleFE_PasswordAuth.executeReset({
					token: this.props.token,
					password: this.state.data.password!,
					passwordCheck: this.state.data.passwordCheck!,
				});
				this.setState({submitting: false, success: true});
				this.props.onSuccess?.();
			} catch (err: any) {
				this.setState({errorMessages: [err.message ?? 'Failed to reset password'], submitting: false});
			}
		});
	};

	private onValueChanged = (value: string, id: keyof ResetData, isAccept: boolean = false) => {
		const data = {...this.state.data};
		data[id] = value;
		this.setState({data, errorMessages: undefined}, () => {
			if (isAccept)
				this.reset();
		});
	};

	render() {
		if (this.state.success)
			return <LL_V_C className="ts-account__authenticate">
				<Label className={'ts-account__message'}>Your password has been reset successfully. You can now log in.</Label>
			</LL_V_C>;

		const data = this.state.data;
		return <LL_V_C className="ts-account__authenticate">
			{_keys(form).map((key, i) => {
				const field = form[key];
				return <TS_PropRenderer.Vertical label={field.label} key={i}>
					<TS_Input
						id={key}
						value={data[key]}
						type={field.type}
						allowAccept={true}
						onChange={(value) => this.onValueChanged(value, key)}
						onAccept={(value) => this.onValueChanged(value, key, true)}
					/>
				</TS_PropRenderer.Vertical>;
			})}
			<LL_H_C className={'ts-account__error-container'}>
				{this.renderErrorMessages()}
			</LL_H_C>
			<Button
				variant={'primary'}
				className={`ts-account__action-button`}
				actionInProgress={this.state.submitting}
				onClick={this.reset}
			>Reset Password</Button>
		</LL_V_C>;
	}

	private renderErrorMessages = () => {
		if (!this.state.errorMessages?.length)
			return '';

		return <LL_V_C className={'ts-account__error-messages'}>
			{this.state.errorMessages.map((message, i) => <Label key={i} className={'ts-account__error-message'}>{message}</Label>)}
		</LL_V_C>;
	};
}
