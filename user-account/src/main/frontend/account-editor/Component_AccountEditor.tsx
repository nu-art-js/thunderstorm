import * as React from 'react';
import {AccountType, accountTypes, DB_Account, DB_Session, Request_CreateAccount} from '../../shared';
import {
	_className,
	ComponentSync,
	Grid,
	LL_H_C,
	LL_V_L,
	ModuleFE_Thunderstorm,
	ModuleFE_Toaster,
	performAction,
	SimpleListAdapter,
	TS_BusyButton,
	TS_DropDown,
	TS_Input,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import {capitalizeFirstLetter, DateTimeFormat_yyyyMMDDTHHmmss, UniqueId, Year} from '@nu-art/ts-common';
import './Component_AccountEditor.scss';
import {ModuleFE_Account} from '../modules/ModuleFE_Account';
import {SessionKeyFE_SessionData} from '../core/consts';
import {TS_Icons} from '@nu-art/ts-styles';


type Props = {
	isPreview?: boolean,
	user?: DB_Account,
	onComplete?: (_id: UniqueId) => void
}

type State = Partial<Request_CreateAccount> & {
	isPreview: boolean,
	tokenTTL: number
	tokenLabel: string
	user?: DB_Account
	sessions: DB_Session[]
}

export class Component_AccountEditor
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.sessions = [];
		state.isPreview = !!nextProps.isPreview;
		state.user = nextProps.user;

		const accountId = nextProps.user?._id;
		if (accountId)
			ModuleFE_Account.vv1.getSessions({_id: accountId}).execute((response) => {
				this.setState({sessions: response.sessions});
			});

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
		return <TS_BusyButton className={className} disabled={disabled} onClick={this.addAccount}>Add
			Account</TS_BusyButton>;
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
				<TS_BusyButton onClick={async () => {
					try {
						const token = await ModuleFE_Account.vv1.createToken({
							accountId: this.state.user?._id!,
							ttl: this.state.tokenTTL,
							label: this.state.tokenLabel
						})
							.executeSync();
						await ModuleFE_Thunderstorm.copyToClipboard(token.token);
						ModuleFE_Toaster.toastSuccess('Token copied to clipboard');
						this.reDeriveState();
					} catch (e) {
						ModuleFE_Toaster.toastError((e as Error).message);
						this.logError(e as Error);
					}
				}}>Generate Token</TS_BusyButton>
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
					const createdAt = DateTimeFormat_yyyyMMDDTHHmmss.format(session.timestamp);
					// @ts-ignore
					const sessionData = ModuleFE_Account.decode(session.sessionId);
					SessionKeyFE_SessionData.get(sessionData).expiration;
					const validTill = DateTimeFormat_yyyyMMDDTHHmmss.format(SessionKeyFE_SessionData.get(sessionData).expiration);
					return <React.Fragment key={session._id}>
						<LL_H_C className={'grid-cell'}>{session.label ?? 'No Label'}</LL_H_C>
						<LL_H_C className={'grid-cell'}>{`${createdAt}`}</LL_H_C>
						<LL_H_C className={'grid-cell'}>{`${validTill}`}</LL_H_C>
						<LL_H_C className={'grid-cell'}>{session.deviceId}</LL_H_C>
						<TS_Icons.copy.component
							onClick={() => ModuleFE_Thunderstorm.copyToClipboard(session.sessionId)}/>
					</React.Fragment>;
				})}
			</Grid>
		</TS_PropRenderer.Vertical>;

	};


	render() {
		return <LL_V_L className={'account-editor'}>
			<LL_V_L className={'editor-section'}>
				{this.renderDropdown()}
				{this.renderInputs()}
				{this.renderSubmitButton()}
			</LL_V_L>
			<LL_V_L className={'editor-section'}>
				{this.renderSessionGrid()}
				{this.renderGenToken()}
			</LL_V_L>
		</LL_V_L>;
	}
}
