import * as React from 'react';
import './ATS_AccountEditor.scss';
import {_className, AppToolsScreen, ComponentSync, LL_H_C, LL_V_L, TS_BusyButton, TS_PropRenderer} from '@thunder-storm/core/frontend';
import {Component_AccountEditor} from '../../account-editor/Component_AccountEditor';
import {DB_Account, DBProto_Account} from '../../../shared';
import {generateUUID} from '@thunder-storm/common';
import {ModuleFE_Account, OnAccountsUpdated} from '../../../_entity/account/frontend/ModuleFE_Account';
import {ApiCallerEventType} from '@thunder-storm/core/frontend/core/db-api-gen/types';


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
		group: 'Permissions',
		modulesToAwait: [ModuleFE_Account]
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

type ListState = {
	list: DB_Account[],
};

type ListProps = {
	setSelectedAccount: (account?: DB_Account) => void,
	user?: DB_Account
}

class Component_AccountList
	extends ComponentSync<ListProps, ListState>
	implements OnAccountsUpdated {

	__onAccountsUpdated(...params: ApiCallerEventType<DBProto_Account>) {
		this.reDeriveState();
	}

	protected deriveStateFromProps(nextProps: ListProps, state: ListState) {
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
