import * as React from 'react';
import {AccountType, accountTypes, API_UserAccount, DB_Account} from '@nu-art/user-account-shared';
import {
	Button,
	ComponentSync,
	Grid,
	LL_H_C,
	LL_V_L,
	ModuleFE_Clipboard,
	ModuleFE_Toaster,
	SimpleListAdapter,
	TS_DropDown,
	TS_PropRenderer
} from '@nu-art/thunder-widgets';
import {capitalizeFirstLetter, DateTimeFormat_yyyyMMDDTHHmmss, JwtTools, UniqueId, Year} from '@nu-art/ts-common';
import './Component_AccountEditor.scss';
import {TS_Icons} from '@nu-art/ts-styles';
import {ModuleFE_Account} from '../_entity/account/ModuleFE_Account.js';
import {TS_Input} from '@nu-art/thunder-widgets/v3';
import {_className} from '@nu-art/thunder-core';


type Props = {
	isPreview?: boolean,
	user?: DB_Account,
	onComplete?: (_id: UniqueId) => void
}

type SessionJWT = {
	sessionData: string,
	exp: number,
	iat: number
	_id: string
	label?: string
	deviceId: string
	sessionIdJwt: string
};

type State = Partial<API_UserAccount['createAccount']['Body']> & {
	isPreview: boolean,
	tokenTTL: number
	tokenLabel: string
	user?: DB_Account
	sessions: SessionJWT[]
}

export class Component_AccountEditor
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.sessions = [];
		state.isPreview = !!nextProps.isPreview;
		state.user = nextProps.user;

		const accountId = nextProps.user?._id;
		if (accountId) {
			void ModuleFE_Account.getSessions({_id: accountId}).then(async response => {
				const sessions = await Promise.all(response.sessions.map(async session => {
					const sessionJWT = await JwtTools.decode<SessionJWT>(session.sessionIdJwt);

					return {
						...sessionJWT,
						_id: session._id,
						label: session.label,
						deviceId: session.deviceId,
						sessionIdJwt: session.sessionIdJwt,
					};
				}));

				this.setState({sessions});
			});
		}

		return state;
	}

	private addAccount = async () => {
		const account = await ModuleFE_Account.createAccount({
			password: this.state.password!,
			type: this.state.type!,
			email: this.state.email!,
			passwordCheck: this.state.password!
		});
		this.props.onComplete?.(account._id);
		this.setState({
			email: undefined,
			password: undefined,
			passwordCheck: undefined,
			type: undefined
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
					type === 'service' ? this.setState({
						type,
						password: undefined
					}) : this.setState({type});
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
				<TS_Input type={'text'}
									placeholder={'Email'}
									value={this.state.email}
									onBlur={(email) => this.setState({email})}/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical disabled={!(this.state.type === 'user')} label={'Temporary Password'}>
				<TS_Input disabled={!(this.state.type === 'user')}
									type={'password'}
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
		return <Button variant={'primary'} className={className} disabled={disabled} onClick={this.addAccount}>Add
			Account</Button>;
	};

	private renderGenToken = () => {
		if (!this.state.isPreview || this.state.user?.type !== 'service')
			return;

		const options = [
			{label: '1 Year', ttl: 1 * Year},
			{label: '2 Year', ttl: 2 * Year},
			{label: '3 Year', ttl: 3 * Year},
			{label: '5 Year', ttl: 5 * Year},
			{label: '10 Year', ttl: 10 * Year},
		];
		return <TS_PropRenderer.Vertical label={'Generate New Token'}>
			<LL_H_C className={'gen-token-row'}>
				<TS_PropRenderer.Vertical label={'TTL'}>
					<TS_DropDown
						placeholder={'Select Session TTL'}
						selected={options.find(option => option.ttl === this.state.tokenTTL)}
						adapter={SimpleListAdapter(options, item => <>{item.item.label}</>)}
						onSelected={option => this.setState({tokenTTL: option.ttl})}/>
				</TS_PropRenderer.Vertical>
				<TS_PropRenderer.Vertical label={'Label (Optional)'}>
					<TS_Input
						type="text"
						value={this.state.tokenLabel}
						onBlur={tokenLabel => this.setState({tokenLabel})}
					/>
				</TS_PropRenderer.Vertical>
				<Button
					variant={'primary'}
					onClick={async () => {
						try {
							const token = await ModuleFE_Account.createToken({
								accountId: this.state.user!._id,
								ttl: this.state.tokenTTL,
								label: this.state.tokenLabel
							});
							await ModuleFE_Clipboard.copyToClipboard(token.token);
							ModuleFE_Toaster.toastSuccess('Token copied to clipboard');
							this.reDeriveState();
						} catch (e) {
							ModuleFE_Toaster.toastError((e as Error).message);
							this.logError(e as Error);
						}
					}}>Generate Token</Button>
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	};

	private renderSessionGrid = () => {
		if (!this.state.sessions.length)
			return '';

		return <TS_PropRenderer.Vertical label={'Sessions'}>
			<Grid>
				<div className={'grid-title'}>Label</div>
				<div className={'grid-title'}>Created At</div>
				<div className={'grid-title'}>Expiry Date</div>
				<div className={'grid-title'}>Device Id</div>
				<div className={'grid-title'}></div>
				{this.state.sessions.map(session => {
					try {
						const createdAt = DateTimeFormat_yyyyMMDDTHHmmss.format(session.iat * 1000);
						const validTill = DateTimeFormat_yyyyMMDDTHHmmss.format(session.exp * 1000);
						return <React.Fragment key={session._id}>
							<LL_H_C className={'grid-cell'}>{session.label ?? 'No Label'}</LL_H_C>
							<LL_H_C className={'grid-cell'}>{`${createdAt}`}</LL_H_C>
							<LL_H_C className={'grid-cell'}>{`${validTill}`}</LL_H_C>
							<LL_H_C className={'grid-cell'}>{session.deviceId}</LL_H_C>
							<TS_Icons.copy.component
								onClick={() => ModuleFE_Clipboard.copyToClipboard(session.sessionIdJwt)}/>
						</React.Fragment>;
					} catch (e) {
						return '';
					}
				})}
			</Grid>
		</TS_PropRenderer.Vertical>;

	};

	private renderDescription = () => {
		if (!this.state.user?.description)
			return '';

		return <TS_PropRenderer.Vertical label={'description'}>
			{this.state.user.description}
		</TS_PropRenderer.Vertical>;
	};


	render() {
		return <LL_V_L className={'account-editor'}>
			<LL_V_L className={'editor-section'}>
				{this.renderDropdown()}
				{this.renderInputs()}
				{this.renderSubmitButton()}
				{this.renderDescription()}
			</LL_V_L>
			<LL_V_L className={'editor-section'}>
				{this.renderSessionGrid()}
				{this.renderGenToken()}
			</LL_V_L>
		</LL_V_L>;
	}
}
