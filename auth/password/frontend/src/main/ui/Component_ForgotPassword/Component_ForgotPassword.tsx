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

import {Button, ComponentSync, LL_H_C, LL_V_C, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {TS_Input} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_PasswordAuth} from '../../ModuleFE_PasswordAuth.js';
import './Component_ForgotPassword.scss';

type Props = {
	onSubmitted?: (email: string) => void;
};

type State = {
	email: string;
	errorMessages?: string[];
	submitting: boolean;
	submitted: boolean;
};

export class Component_ForgotPassword
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.email ??= '';
		state.submitted ??= false;
		return state;
	}

	private requestReset = async () => {
		if (this.state.submitting)
			return;

		if (!this.state.email) {
			this.setState({errorMessages: ['  * missing Email']});
			return;
		}

		this.setState({submitting: true, errorMessages: undefined}, async () => {
			try {
				await ModuleFE_PasswordAuth.requestReset({email: this.state.email});
				this.setState({submitting: false, submitted: true});
				this.props.onSubmitted?.(this.state.email);
			} catch (err: any) {
				this.setState({errorMessages: [err.message ?? 'Failed to send reset email'], submitting: false});
			}
		});
	};

	private onValueChanged = (value: string, isAccept: boolean = false) => {
		this.setState({email: value, errorMessages: undefined}, () => {
			if (isAccept)
				this.requestReset();
		});
	};

	render() {
		if (this.state.submitted)
			return <LL_V_C className="ts-account__authenticate">
				<p className={'ts-account__message'}>If an account exists for {this.state.email}, we sent a password reset link.</p>
			</LL_V_C>;

		return <LL_V_C className="ts-account__authenticate">
			<TS_PropRenderer.Vertical label={'Email'}>
				<TS_Input
					id={'email'}
					value={this.state.email}
					type={'text'}
					allowAccept={true}
					onChange={(value) => this.onValueChanged(value)}
					onAccept={(value) => this.onValueChanged(value, true)}
				/>
			</TS_PropRenderer.Vertical>
			<LL_H_C className={'ts-account__error-container'}>
				{this.renderErrorMessages()}
			</LL_H_C>
			<Button
				variant={'primary'}
				className={`ts-account__action-button`}
				actionInProgress={this.state.submitting}
				onClick={this.requestReset}
			>Send Reset Link</Button>
		</LL_V_C>;
	}

	private renderErrorMessages = () => {
		if (!this.state.errorMessages?.length)
			return '';

		return <ul className={'ts-account__error-messages'}>
			{this.state.errorMessages.map((message, i) => <li key={i}>{message}</li>)}
		</ul>;
	};
}
