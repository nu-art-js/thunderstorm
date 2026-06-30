import {_keys, exists, formatTimestamp} from '@nu-art/ts-common';
import {AccountPassword, API_PasswordAuth, ErrorType_LoginBlocked} from '@nu-art/password-auth-shared';
import './Component_Login.scss';
import {Button, ComponentSync, LL_H_C, LL_V_C, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {Label} from '@nu-art/thunder-widgets/v3';
import {ModuleFE_PasswordAuth} from '../../ModuleFE_PasswordAuth.js';
import {StorageKey_DeviceId} from '@nu-art/user-account-frontend';
import {Component_LoginBlocked} from '../Component_LoginBlocked/Component_LoginBlocked.js';
import {TS_Input} from '@nu-art/thunder-widgets/v3';
import {AccountEmail} from '@nu-art/user-account-shared';

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
	extends ComponentSync<Props, State<API_PasswordAuth['login']['Body']>> {

	protected deriveStateFromProps(nextProps: Props, state: State<API_PasswordAuth['login']['Body']>) {
		state.data ??= {};
		return state;
	}

	private loginDataValid = () => {
		const data: Partial<API_PasswordAuth['login']['Body']> = this.state.data;
		const errors = _keys(form).map(key => {
			const field = form[key];
			return data[key] ? undefined : `  * missing ${field.label}`;
		}).filter(error => !!error);

		if (errors.length > 0) {
			return false;
		}

		return true;
	};

	private login = async () => {
		if (this.state.submitting)
			return;

		if (exists(this.state.blockedUntil))
			return;

		if (!this.loginDataValid())
			return;

		this.setState({submitting: true, errorMessages: undefined}, async () => {
			try {
				await ModuleFE_PasswordAuth.login({...this.state.data, deviceId: StorageKey_DeviceId.get()} as API_PasswordAuth['login']['Body']);
				this.setState({submitting: false});
			} catch (err: any) {
				if (err.errorResponse.error?.type === ErrorType_LoginBlocked) {
					const blockedUntil = err.errorResponse.error.data.blockedUntil;
					return this.setState({
						blockedUntil: blockedUntil,
						errorMessages: [`Login blocked until ${formatTimestamp('DD/MM/YYYY HH:mm', blockedUntil)}`],
					});
				}
				this.setState({errorMessages: ['Email or password incorrect'], submitting: false});
			}
		});
	};

	private onValueChanged = (value: string, id: keyof API_PasswordAuth['login']['Body'], isAccept: boolean = false) => {
		const data = {...this.state.data};
		data[id] = value;
		this.setState({data, errorMessages: undefined}, () => {
			if (isAccept)
				this.login();
		});
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
							allowAccept={true}
							onChange={(value) => {
								this.onValueChanged(value, key as keyof API_PasswordAuth['login']['Body']);
							}}
							onAccept={(value) => {
								this.onValueChanged(value, key as keyof API_PasswordAuth['login']['Body'], true);
							}}
						/>
					</TS_PropRenderer.Vertical>;
				}
			)}
			<LL_H_C className={'ts-account__error-container'}>
				{this.errorRenderer()}
			</LL_H_C>
			<Button
				variant={'primary'}
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

		return <LL_V_C className={'ts-account__error-messages'}>
			{this.state.errorMessages.map((message, i) => {
				return <Label key={i} className={'ts-account__error-message'}>{message}</Label>;
			})}
		</LL_V_C>;
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
