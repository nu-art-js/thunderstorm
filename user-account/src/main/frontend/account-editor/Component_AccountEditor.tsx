import * as React from 'react';
import {AccountType, accountTypes, Request_CreateAccount, UI_Account} from '../../shared';
import {
	ComponentSync,
	LL_H_C,
	LL_V_L, performAction,
	SimpleListAdapter, TS_BusyButton,
	TS_DropDown, TS_Input,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_AccountV2} from '../modules/v2/ModuleFE_v2_Account';
import {capitalizeFirstLetter} from '@nu-art/ts-common';
import './Component_AccountEditor.scss';

type Props = {
	isPreview?: boolean,
	user?: UI_Account
}

type State = Request_CreateAccount & {
	isPreview: boolean,
	user?: UI_Account
}

export class Component_AccountEditor extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state?: State): State {
		state = this.state ? {...this.state} : {} as State;

		state.isPreview = !!nextProps.isPreview;
		state.user = nextProps.user;

		return state;
	}

	private addAccount = async () => {
		return performAction(async () => {
			await ModuleFE_AccountV2.vv1.createAccount({password: this.state.password, type: this.state.type, email: this.state.email, password_check: this.state.password}).executeSync();
			await ModuleFE_AccountV2.v1.sync().executeSync();
			this.setState({email: '', password: '', password_check: ''});
		}, {type: 'notification', notificationLabels: {inProgress: 'Creating Account', success: 'Account Created', failed: 'Failed Creating Account'}});
	};

	// private canCreate = () => {
	// 	return this.state.email && this.state.type
	// };

	private renderDropdown = () => {
		if (this.state.isPreview)
			return <TS_PropRenderer.Vertical label={'User Type'}>
				<div>{capitalizeFirstLetter(this.state.user?.type ? this.state.user.type : '')}</div>
			</TS_PropRenderer.Vertical>;

		return <TS_PropRenderer.Vertical label={'User Type'}>
			<TS_DropDown
				placeholder={'account type'}
				selected={this.state.type}
				adapter={SimpleListAdapter([...accountTypes], i => <div className={'node-data'}>
					<span>{i.item}</span></div>)}
				onSelected={(type: AccountType) => {
					type === 'service' ? this.setState({type, password: undefined}) : this.setState({type});
				}}></TS_DropDown>
		</TS_PropRenderer.Vertical>;
	};

	private renderInputs = () => {
		if (this.state.isPreview)
			return <LL_H_C className={'inputs-row'}>
				<TS_PropRenderer.Vertical label={'Email'}>
					<div>{this.state.user?.email}</div>
				</TS_PropRenderer.Vertical>
				<TS_PropRenderer.Vertical label={'Has Password'}>
					<div>{this.state.user?._newPasswordRequired}</div>
				</TS_PropRenderer.Vertical>
			</LL_H_C>;


		return <LL_H_C className={'inputs-row'}>
			<TS_PropRenderer.Vertical label={'Email'}>
				<TS_Input type={'text'} placeholder={'Email'}
						  onChange={(email) => this.setState({email})}/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical disabled={!(this.state.type === 'user')} label={'Temporary Password'}>
				<TS_Input disabled={!(this.state.type === 'user')} type={'password'}
						  placeholder={'Temporary Password'}
						  onChange={(password) => this.setState({password})}/>
			</TS_PropRenderer.Vertical>
		</LL_H_C>;
	};

	private renderSubmitButton = () => {
		if (this.state.isPreview)
			return '';

		return <TS_BusyButton onClick={this.addAccount}>Add Account</TS_BusyButton>;
	};


	render() {
		return <LL_V_L className={'form-container'}>
			{this.renderDropdown()}
			{this.renderInputs()}
			{this.renderSubmitButton()}
		</LL_V_L>;
	}
}
