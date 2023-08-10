import * as React from 'react';
import './ATS_AccountEditor.scss';
import {
	_className,
	AppToolsScreen,
	ComponentSync,
	LL_H_C,
	LL_V_L,
	TS_BusyButton,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend';
import {OnAccountsUpdated} from '../../modules/v2/ModuleFE_v2_Account';
import {Component_AccountEditor} from '../../account-editor/Component_AccountEditor';
import {DB_AccountV3} from '../../../shared';
import {
	ApiCallerEventType,
	Props_SmartComponent,
	SmartComponent,
	State_SmartComponent
} from '@nu-art/db-api-generator/frontend';
import {generateUUID} from '@nu-art/ts-common';
import {ModuleFE_AccountV3} from '../../modules/v3/ModuleFE_v3_Account';


type Props = {}

type State = {
	selectedUser?: DB_AccountV3,
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

	private setSelectedAccount = (account?: DB_AccountV3) => {
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
	list: DB_AccountV3[],
};

type ListProps = Props_SmartComponent & {
	setSelectedAccount: (account?: DB_AccountV3) => void,
	user?: DB_AccountV3
}

class Component_AccountList
	extends SmartComponent<ListProps, ListState> implements OnAccountsUpdated {

	__onAccountsUpdated(...params: ApiCallerEventType<DB_AccountV3>) {
		this.reDeriveState();
	}

	static defaultProps = {
		modules: [ModuleFE_AccountV3]
	};

	protected async deriveStateFromProps(nextProps: ListProps, state: ListState) {
		state.list = ModuleFE_AccountV3.cache.allMutable() as DB_AccountV3[];
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
