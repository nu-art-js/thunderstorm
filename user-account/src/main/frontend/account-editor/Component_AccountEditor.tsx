import * as React from 'react';
import {AccountType, accountTypes, DB_Account, Request_CreateAccount} from '../../shared';
import {
	_className,
	ComponentSync,
	LL_H_C,
	LL_V_L, ModuleFE_Thunderstorm, ModuleFE_Toaster,
	performAction,
	SimpleListAdapter,
	TS_BusyButton,
	TS_DropDown,
	TS_Input,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import {capitalizeFirstLetter, UniqueId, Year} from '@nu-art/ts-common';
import './Component_AccountEditor.scss';
import {ModuleFE_Account} from '../modules/ModuleFE_Account';

type Props = {
	isPreview?: boolean,
	user?: DB_Account,
	onComplete?: (_id: UniqueId) => void
}

type State = Partial<Request_CreateAccount> & {
	isPreview: boolean,
	user?: DB_Account
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
			const account = await ModuleFE_Account.vv1.createAccount({
				password: this.state.password!,
				type: this.state.type!,
				email: this.state.email!,
				passwordCheck: this.state.password!
			}).executeSync();
			this.props.onComplete?.(account._id);
			this.setState({email: undefined, password: undefined, passwordCheck: undefined, type: undefined});
		}, {
			type: 'notification',
			notificationLabels: {
				inProgress: 'Creating Account',
				success: 'Account Created',
				failed: 'Failed Creating Account'
			}
		});
	};

	private canCreate = () => {
		const baseConditions = !!(this.state.email && this.state.type);
		let extraConditions = true;

		if (this.state.type === 'user')
			extraConditions = !!this.state.password;

		return baseConditions && extraConditions;
	};

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
				{this.state.user?.type !== 'service' && <TS_PropRenderer.Vertical label={'Need To Set Password'}>
					<div>{this.state.user?._newPasswordRequired ? 'Yes' : 'No'}</div>
				</TS_PropRenderer.Vertical>}
			</LL_H_C>;


		return <LL_H_C className={'inputs-row'}>
			<TS_PropRenderer.Vertical label={'Email'}>
				<TS_Input type={'text'} placeholder={'Email'} value={this.state.email}
									onBlur={(email) => this.setState({email})}/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical disabled={!(this.state.type === 'user')} label={'Temporary Password'}>
				<TS_Input disabled={!(this.state.type === 'user')} type={'password'}
									value={this.state.password}
									placeholder={'Temporary Password'}
									onBlur={(password) => this.setState({password})}/>
			</TS_PropRenderer.Vertical>
		</LL_H_C>;
	};

	private renderSubmitButton = () => {
		if (this.state.isPreview)
			return '';

		const disabled = !this.canCreate();
		const className = _className(disabled && 'disabled');
		return <TS_BusyButton className={className} disabled={disabled} onClick={this.addAccount}>Add
			Account</TS_BusyButton>;
	};

	private renderGenToken = () => {
		if (!this.state.isPreview || this.state.user?.type !== 'service')
			return;

		return <TS_BusyButton onClick={async () => {
			try {
				const token = await ModuleFE_Account.vv1.createToken({accountId: this.state.user?._id!, ttl: 2 * Year}).executeSync();
				await ModuleFE_Thunderstorm.copyToClipboard(token.token);
				ModuleFE_Toaster.toastSuccess('Token copied to clipboard');
			} catch (e) {
				ModuleFE_Toaster.toastError((e as Error).message);
				this.logError(e as Error);
			}
		}}>Generate Token</TS_BusyButton>;
	};


	render() {
		return <LL_V_L className={'account-editor'}>
			{this.renderDropdown()}
			{this.renderInputs()}
			{this.renderGenToken()}
			{this.renderSubmitButton()}
		</LL_V_L>;
	}
}
