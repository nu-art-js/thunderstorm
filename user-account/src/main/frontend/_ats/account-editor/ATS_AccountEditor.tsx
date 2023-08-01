import * as React from 'react';
import './ATS_AccountEditor.scss';
import {AppToolsScreen, ComponentAsync, SimpleListAdapter, TS_BusyButton, TS_DropDown, TS_Input} from '@nu-art/thunderstorm/frontend';
import {AccountType, accountTypes, Request_CreateAccount} from "../../../shared";
import {ModuleFE_AccountV2} from "../../modules/v2/ModuleFE_v2_Account";


type State = Request_CreateAccount;

export class ATS_AccountEditor
	extends ComponentAsync<{}, State> {

	static screen: AppToolsScreen = {name: 'Accounts Editor', key: 'user-account', renderer: this, group: 'TS Dev Tools'};

	// ######################### Life Cycle #########################

	protected async deriveStateFromProps(nextProps: {}) {
		const state: State = this.state ? {...this.state} : {} as State;
		return state;
	}

	// ######################### Logic #########################

	addAccount = async () => {
		return await ModuleFE_AccountV2.vv1.createAccount({...this.state, password_check: this.state.password}).executeSync();
	};

	render() {
		return <div style={{width: '30%'}}>
			<TS_Input type={'text'} placeholder={'email'} onChange={(email) => this.setState({email})}/>
			<TS_DropDown
				className={'fancy'}
				placeholder={'account type'}
				selected={this.state.type}
				adapter={SimpleListAdapter([...accountTypes], i => <div className={'node-data'}><span>{i.item}</span></div>)}
				onSelected={(type: AccountType) => {
					type === 'service' ? this.setState({type, password: undefined}) : this.setState({type});
				}}></TS_DropDown>
			{this.state.type === 'user' ?
				<>
					<TS_Input type={'password'} placeholder={'temporary password'} onChange={(password) => this.setState({password})}/>
				</> :
				<></>
			}
			<TS_BusyButton onClick={this.addAccount}>Add Account</TS_BusyButton>
		</div>;
	}
}
