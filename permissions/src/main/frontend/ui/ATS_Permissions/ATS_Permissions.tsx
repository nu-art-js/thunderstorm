import * as React from 'react';
import {
	AppToolsScreen,
	ComponentSync,
	genericNotificationAction,
	LL_H_C,
	LL_V_L,
	ModuleFE_BaseApi,
	Tab,
	TS_AppTools,
	TS_Button,
	TS_Tabs
} from '@nu-art/thunderstorm/frontend';
import './ATS_Permissions.scss';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert';
import {ModuleFE_SyncManagerV2} from '@nu-art/thunderstorm/frontend/modules/sync-manager/ModuleFE_SyncManagerV2';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {timeout} from '@nu-art/ts-common';
import {ModulePackFE_Permissions} from '../../core/module-pack';
import {SessionKey_StrictMode_FE} from '../../consts';
import {PermissionProjectsEditor} from '../permission-editors/permission-projects-editor';
import {PermissionDomainsEditor} from '../permission-editors/permission-domains-editor';
import {PermissionGroupsEditor} from '../permission-editors/permission-groups-editor';
import {PermissionUsersEditor} from '../permission-editors/permission-users-editor';


type _Props = {}
type _State = { creatingPermissions?: boolean }

export class ATS_Permissions
	extends ComponentSync<_Props, _State> {

	static screen: AppToolsScreen = {
		key: 'permissions-dev-page',
		name: 'Permissions',
		renderer: this,
		group: 'Permissions',
		modulesToAwait: ModulePackFE_Permissions as ModuleFE_BaseApi<any>[],
	};

	//######################### Render #########################

	render() {
		return <LL_V_L id={'dev-page__permissions'}>
			<LL_H_C className="match_width flex__space-between">{TS_AppTools.renderPageHeader('Permissions Editor')}
				<LL_H_C>
					<TS_Button
						disabled={this.state.creatingPermissions}
						className={'item-list__add-button'}
						onClick={this.toggleStrictMode}>{SessionKey_StrictMode_FE.get() ? 'Disable' : 'Enable'} Strict Mode</TS_Button>
					<TS_Button
						disabled={this.state.creatingPermissions}
						className={'item-list__add-button'}
						onClick={this.createPermissions}>Create Project</TS_Button>
				</LL_H_C>
			</LL_H_C>
			<ComponentEditor_Permissions/>
		</LL_V_L>;
	}

	private toggleStrictMode = async () => {
		await genericNotificationAction(async (notification) => {
			this.setState({creatingPermissions: true});
			await ModuleFE_PermissionsAssert.v1.toggleStrictMode({}).executeSync();
			await timeout(3000);
			await ModuleFE_Account.vv1.refreshSession({}).executeSync();
			await ModuleFE_SyncManagerV2.sync();
		}, 'Toggling Strict Mode');

		this.setState({creatingPermissions: false});
	};

	private createPermissions = async () => {
		await genericNotificationAction(async (notification) => {
			this.setState({creatingPermissions: true});
			await ModuleFE_PermissionsAssert.v1.createProject({}).executeSync();
			await ModuleFE_Account.vv1.refreshSession({}).executeSync();
			notification.content('Syncing dbs').show();
			await ModuleFE_SyncManagerV2.sync();
		}, 'Creating Permissions');

		this.setState({creatingPermissions: false});
	};
}

export class ComponentEditor_Permissions
	extends ComponentSync {

	//######################### Render #########################

	private renderTabs = () => {
		const tabs: Tab[] = [
			{title: 'Projects', uid: 'projects', content: <PermissionProjectsEditor/>},
			{
				title: 'Domains',
				uid: 'domains',
				content: () => <PermissionDomainsEditor/>
			},
			{
				title: 'Groups',
				uid: 'groups',
				content: <PermissionGroupsEditor/>
			},
			{title: 'Users', uid: 'users', content: <PermissionUsersEditor/>},
		];
		return <TS_Tabs tabs={tabs}/>;
	};

	render() {
		return <LL_V_L id={'dev-page__permissions'}>
			{this.renderTabs()}
		</LL_V_L>;
	}
}