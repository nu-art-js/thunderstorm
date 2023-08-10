import * as React from 'react';
import {ComponentSync, LL_V_L, TS_BusyButton, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {ThisShouldNotHappenException} from '@nu-art/ts-common';
import {ModuleFE_AccountV3, SessionKey_Account_FE_V3} from '../../modules/v3/ModuleFE_v3_Account';

type Props = {
	postSubmitAction?: () => void;
};

type State = {
	shouldGiveCurrentPassword: boolean;
	currentPassword?: string;
	newPassword?: string;
	newPasswordCheck?: string;
};

export class Component_ChangePassword
	extends ComponentSync<Props, State> {

	// ######################## Life Cycle ########################
	protected deriveStateFromProps(nextProps: any, state: State): State {
		state ??= this.state ? {...this.state} : {} as State;
		if (!ModuleFE_AccountV3.accountId)
			throw new ThisShouldNotHappenException('Rendering a change password component without user logged in');
		state.shouldGiveCurrentPassword = SessionKey_Account_FE_V3.get().hasPassword;
		return state;
	}

	// ######################## Logic ########################
	private submitNewPassword = async () => {
		if (!this.state.newPassword || !this.state.newPasswordCheck) {
			this.logError('No password or password check');
			return;
		}

		const account = ModuleFE_AccountV3.cache.unique(ModuleFE_AccountV3.accountId)!;

		try {
			if (!this.state.shouldGiveCurrentPassword)
				await ModuleFE_AccountV3.vv1.setPassword({
					userEmail: account.email,
					password: this.state.newPassword,
					password_check: this.state.newPasswordCheck,
				}).executeSync();
			else {
				if (!this.state.currentPassword) {
					this.logError('No current password given');
					return;
				}
				await ModuleFE_AccountV3.vv1.changePassword({
					userEmail: account.email,
					originalPassword: this.state.currentPassword,
					newPassword: this.state.newPassword,
					newPassword_check: this.state.newPasswordCheck,
				}).executeSync();
			}
			this.props.postSubmitAction?.();
		} catch (e: any) {
			this.logError(e);
		}
	};

	// ######################## Render ########################
	private renderCurrentPassword = () => {
		if (!this.state.shouldGiveCurrentPassword)
			return '';

		return <TS_PropRenderer.Vertical label={'Current Password'}>
			<TS_Input type={'password'} value={this.state.currentPassword} onChange={val => this.setState({currentPassword: val})}/>
		</TS_PropRenderer.Vertical>;
	};

	render() {
		return <LL_V_L className={'ts-account__change-password'}>
			{this.renderCurrentPassword()}
			<TS_PropRenderer.Vertical label={'New Password'}>
				<TS_Input type={'password'} value={this.state.newPassword} onChange={val => this.setState({newPassword: val})}/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'New Password Check'}>
				<TS_Input type={'password'} value={this.state.newPasswordCheck} onChange={val => this.setState({newPasswordCheck: val})}/>
			</TS_PropRenderer.Vertical>
			<TS_BusyButton onClick={this.submitNewPassword}>Submit</TS_BusyButton>
		</LL_V_L>;
	}
}