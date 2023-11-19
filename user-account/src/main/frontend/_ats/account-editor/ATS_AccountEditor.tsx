import * as React from 'react';
import './ATS_AccountEditor.scss';
import {
	_className,
	AppToolsScreen,
	ComponentSync,
	LL_H_C,
	LL_V_L,
	Props_SmartComponent,
	SmartComponent,
	State_SmartComponent,
	TS_BusyButton,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import {Component_AccountEditor} from '../../account-editor/Component_AccountEditor';
import {DB_Account} from '../../../shared';
import {generateUUID} from '@nu-art/ts-common';
import {ModuleFE_Account, OnAccountsUpdated} from '../../modules/ModuleFE_Account';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';


type Props = {}

type State = {
	selectedUser?: DB_Account,
	isPreview?: boolean
}

export class ATS_AccountEditor
	extends ComponentSync<Props, State> {

	static screen: AppToolsScreen = {
		name: 'Accounts Editor',
		key: 'user-account',
		renderer: this,
		group: 'Permissions'
	};

	// ######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state = this.state ? {...this.state} : {} as State;
		return state;
	}

	// ######################### Logic #########################

	private setSelectedAccount = (account?: DB_Account) => {
		if (!account)
			this.setState({isPreview: false, selectedUser: undefined});
		else
			this.setState({isPreview: true, selectedUser: account});
	};

	render() {
		return <LL_H_C className={'account-editor-form'}>
			<Component_AccountList user={this.state.selectedUser} setSelectedAccount={this.setSelectedAccount}/>
			<Component_AccountEditor isPreview={this.state.isPreview} user={this.state.selectedUser}/>
		</LL_H_C>;
	}
}

type ListState = State_SmartComponent & {
	list: DB_Account[],
};

type ListProps = Props_SmartComponent & {
	setSelectedAccount: (account?: DB_Account) => void,
	user?: DB_Account
}

class Component_AccountList
	extends SmartComponent<ListProps, ListState>
	implements OnAccountsUpdated {

	__onAccountsUpdated(...params: ApiCallerEventType<DB_Account>) {
		this.reDeriveState();
	}

	static defaultProps = {
		modules: [ModuleFE_Account]
	};

	protected async deriveStateFromProps(nextProps: ListProps, state: ListState) {
		state.list = ModuleFE_Account.cache.allMutable() as DB_Account[];
		return state;
	}

	render() {

		return <LL_V_L className={'form-container account-list'}>
			<LL_H_C className={'match_width'}>
				<TS_PropRenderer.Horizontal className={'match_width'} label={'Accounts List'}>
					<TS_BusyButton onClick={async () => this.props.setSelectedAccount()}>Create
						Account</TS_BusyButton>
				</TS_PropRenderer.Horizontal>
			</LL_H_C>
			<LL_V_L className={'match_width users-list'}>
				{
					this.state.list.map(account => {
							const className = _className('match_width', 'row', this.props.user?._id === account._id && 'selected');
							return <TS_PropRenderer.Horizontal onClick={() => this.props.setSelectedAccount(account)}
																								 key={generateUUID()} className={className}
																								 label={account.email}/>;
						}
					)
				}
			</LL_V_L>
		</LL_V_L>;
	}
}
