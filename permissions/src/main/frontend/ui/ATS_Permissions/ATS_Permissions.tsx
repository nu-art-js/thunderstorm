import * as React from 'react';
import {
	AppToolsScreen,
	LL_V_L,
	LL_H_C,
	Props_SmartComponent,
	SmartComponent,
	State_SmartComponent,
	Tab,
	TS_AppTools,
	TS_Tabs, TS_Button
} from '@nu-art/thunderstorm/frontend';
import './ATS_Permissions.scss';
import {
	ModuleFE_PermissionsAccessLevel,
	ModuleFE_PermissionsDomain,
	ModuleFE_PermissionsGroup,
	ModuleFE_PermissionsProject,
	ModuleFE_PermissionsUser,
	PermissionDomainsEditor,
	PermissionGroupsEditor,
	PermissionProjectsEditor,
	PermissionUsersEditor
} from '../..';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert';


type State = State_SmartComponent;

type Props = Props_SmartComponent;

export class ATS_Permissions
	extends SmartComponent<Props, State> {

	static screen: AppToolsScreen = {key: 'permissions', name: 'Permissions Editor', renderer: this, group: 'TS Dev Tools'};

	static defaultProps = {
		modules: [ModuleFE_PermissionsProject, ModuleFE_PermissionsDomain, ModuleFE_PermissionsAccessLevel, ModuleFE_PermissionsGroup, ModuleFE_PermissionsUser]
	};

	//######################### Life Cycle #########################

	protected async deriveStateFromProps(nextProps: Props, state: State) {
		state ??= this.state ? {...this.state} : {} as State;
		// if (!ModuleFE_AccountV2.getAccounts().length)
		// 	await ModuleFE_Account.v1.query({}).executeSync();
		return state;
	}

	//######################### Render #########################

	private renderTabs = () => {
		const tabs: Tab[] = [
			{title: 'Projects', uid: 'projects', content: <PermissionProjectsEditor/>},
			{title: 'Domains', uid: 'domains', content: <PermissionDomainsEditor/>},
			{title: 'Groups', uid: 'groups', content: <PermissionGroupsEditor/>},
			{title: 'Users', uid: 'users', content: <PermissionUsersEditor/>},
		];
		return <TS_Tabs tabs={tabs}/>;
	};

	render() {
		return <LL_V_L id={'dev-page__permissions'}>
			<LL_H_C className="match_width flex__space-between">{TS_AppTools.renderPageHeader('Permissions Editor')}
				<TS_Button className={'item-list__add-button'}
									 onClick={() => ModuleFE_PermissionsAssert.v1.createProject({}).executeSync()}>Create Project</TS_Button>
			</LL_H_C>
			{this.renderTabs()}
		</LL_V_L>;
	}
}