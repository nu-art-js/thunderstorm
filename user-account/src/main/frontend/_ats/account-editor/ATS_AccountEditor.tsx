import * as React from 'react';
import './ATS_AccountEditor.scss';
import {
	AppToolsScreen,
	ComponentSync,
	LL_H_C,
	LL_V_L,
	TS_BusyButton,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_AccountV2, OnAccountsUpdated} from '../../modules/v2/ModuleFE_v2_Account';
import {TS_Icons} from '@nu-art/ts-styles';
import {Component_AccountEditor} from '../../account-editor/Component_AccountEditor';
import {DB_Account_V2, UI_Account} from '../../../shared';
import {
	ApiCallerEventType,
	Props_SmartComponent,
	SmartComponent,
	State_SmartComponent
} from '@nu-art/db-api-generator/frontend';
import {generateUUID} from '@nu-art/ts-common';


type Props = {}

type State = {
	selectedUser?: UI_Account,
	isPreview?: boolean
}

export class ATS_AccountEditor
	extends ComponentSync<Props, State> {

	static screen: AppToolsScreen = {name: 'Accounts Editor', key: 'user-account', renderer: this, group: 'TS Dev Tools'};


	// ######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state = this.state ? {...this.state} : {} as State;
		return state;
	}

	// ######################### Logic #########################

	private setSelectedAccount = (account?: UI_Account) => {
		if (!account)
			this.setState({isPreview: false, selectedUser: undefined});
		else
			this.setState({isPreview: true, selectedUser: account});
	};

	render() {
		return <LL_H_C className={'account-editor-form'}>
			<Component_AccountList setSelectedAccount={this.setSelectedAccount}/>
			<Component_AccountEditor isPreview={this.state.isPreview} user={this.state.selectedUser}/>
		</LL_H_C>;
	}
}


type ListState = State_SmartComponent & {
	list: UI_Account[]
};

type ListProps = Props_SmartComponent & {
	setSelectedAccount: (account?: UI_Account) => void
}

class Component_AccountList
	extends SmartComponent<ListProps, ListState> implements OnAccountsUpdated {

	__onAccountsUpdated(...params: ApiCallerEventType<DB_Account_V2>) {
		this.reDeriveState();
	}

	static defaultProps = {
		modules: [ModuleFE_AccountV2]
	};

	protected async deriveStateFromProps(nextProps: ListProps, state: ListState) {
		state.list = ModuleFE_AccountV2.cache.allMutable() as UI_Account[];
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
					this.state.list.map(account =>
						<TS_PropRenderer.Horizontal key={generateUUID()} className={'match_width row'}
													label={account.email}>
							<LL_H_C className={'user-utils'}>
								<TS_Icons.information.component
									onClick={() => this.props.setSelectedAccount(account)}/>
							</LL_H_C>
						</TS_PropRenderer.Horizontal>
					)
				}
			</LL_V_L>
		</LL_V_L>;
	}
}
