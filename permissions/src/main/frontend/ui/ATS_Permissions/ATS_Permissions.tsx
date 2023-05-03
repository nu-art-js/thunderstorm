import * as React from 'react';
import {AppToolsScreen, ComponentSync, LL_V_L, Tab, TS_AppTools, TS_Tabs} from '@nu-art/thunderstorm/frontend';
import './ATS_Permissions.scss';
import {PermissionDomainsEditor, PermissionGroupsEditor, PermissionProjectsEditor, PermissionUsersEditor} from '../..';

type State = {};

export class ATS_Permissions_Class
	extends ComponentSync<{}, State> {

	//######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state ??= this.state ? {...this.state} : {} as State;
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
			{TS_AppTools.renderPageHeader('Permissions Editor')}
			{this.renderTabs()}
		</LL_V_L>;
	}
}

export const ATS_Permissions: AppToolsScreen = {
	key: 'permissions',
	renderer: ATS_Permissions_Class,
	name: 'Permissions Editor',
	type: 'dev'
};