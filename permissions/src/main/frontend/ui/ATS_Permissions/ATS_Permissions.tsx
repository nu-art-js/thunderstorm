import * as React from 'react';
import {
	_className,
	AppToolsScreen,
	ComponentSync,
	genericNotificationAction,
	LL_H_C,
	LL_V_L, ModuleFE_RoutingV2,
	TS_AppTools,
	TS_Button,
	TS_NavLink
} from '@nu-art/thunderstorm/frontend';
import './ATS_Permissions.scss';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {arrayIncludesAny, timeout} from '@nu-art/ts-common';
import {SessionKey_StrictMode_FE} from '../../consts';
import {ModuleFE_PermissionAccessLevel} from '../../../_entity/permission-access-level/frontend';
import {ModuleFE_PermissionAPI} from '../../../_entity/permission-api/frontend';
import {ModuleFE_PermissionProject} from '../../../_entity/permission-project/frontend';
import {ModuleFE_PermissionDomain} from '../../../_entity/permission-domain/frontend';
import {ModuleFE_PermissionGroup} from '../../../_entity/permission-group/frontend';
import {ModuleFE_PermissionUser} from '../../../_entity/permission-user/frontend';
import {Outlet} from 'react-router-dom';
import {PermissionUsersEditor} from '../permission-editors/permission-users-editor';
import {PermissionProjectsEditor} from '../permission-editors/permission-project-editor/permission-projects-editor';
import {PermissionDomainsEditor} from '../permission-editors/permission-domains-editor';
import {PermissionGroupsEditor} from '../permission-editors/permission-groups-editor';

export class ATS_Permissions
	extends ComponentSync {

	static screen: AppToolsScreen = {
		key: 'permissions-dev-page',
		name: 'Permissions',
		renderer: this,
		group: 'Permissions',
		modulesToAwait: [
			ModuleFE_PermissionAccessLevel,
			ModuleFE_PermissionAPI,
			ModuleFE_PermissionProject,
			ModuleFE_PermissionDomain,
			ModuleFE_PermissionGroup,
			ModuleFE_PermissionUser,
		],
		children: [
			PermissionProjectsEditor.Route,
			PermissionDomainsEditor.Route,
			PermissionGroupsEditor.Route,
			PermissionUsersEditor.Route,
		]
	};

	componentDidMount() {
		const routeKeys = [PermissionProjectsEditor.Route.key,
			PermissionDomainsEditor.Route.key,
			PermissionGroupsEditor.Route.key,
			PermissionUsersEditor.Route.key,
		];
		if (!arrayIncludesAny(window.location.pathname.split('/'), routeKeys))
			ModuleFE_RoutingV2.goToRoute(PermissionProjectsEditor.Route);
	}

	//######################### Logic #########################

	private toggleStrictMode = async () => {
		await genericNotificationAction(async (notification) => {
			this.setState({creatingPermissions: true});
			await ModuleFE_PermissionsAssert.v1.toggleStrictMode({}).executeSync();
			await timeout(3000);
			await ModuleFE_Account._v1.refreshSession({}).executeSync();
		}, 'Toggling Strict Mode');

		this.setState({creatingPermissions: false});
	};

	//######################### Render #########################

	render() {
		return <LL_V_L id={'dev-page__permissions'}>
			<LL_H_C className="match_width flex__space-between">{TS_AppTools.renderPageHeader('Permissions Editor')}
				<LL_H_C>
					<TS_Button
						disabled={this.state.creatingPermissions}
						className={'item-list__add-button'}
						onClick={this.toggleStrictMode}>{SessionKey_StrictMode_FE.get() ? 'Disable' : 'Enable'} Strict
						Mode</TS_Button>
				</LL_H_C>
			</LL_H_C>
			<LL_H_C className={'links-container'}>
				<TS_NavLink
					key={PermissionProjectsEditor.Route.key}
					route={PermissionProjectsEditor.Route}
					ignoreClickOnSameRoute={true}
					className={({isActive}) => _className('link-button', isActive && 'selected')}
				>
					Project
				</TS_NavLink>
				<TS_NavLink
					key={PermissionDomainsEditor.Route.key}
					route={PermissionDomainsEditor.Route}
					ignoreClickOnSameRoute={true}
					className={({isActive}) => _className('link-button', isActive && 'selected')}
				>
					Domains
				</TS_NavLink>
				<TS_NavLink
					key={PermissionGroupsEditor.Route.key}
					route={PermissionGroupsEditor.Route}
					ignoreClickOnSameRoute={true}
					className={({isActive}) => _className('link-button', isActive && 'selected')}
				>
					Groups
				</TS_NavLink>
				<TS_NavLink
					key={PermissionUsersEditor.Route.key}
					route={PermissionUsersEditor.Route}
					ignoreClickOnSameRoute={true}
					className={({isActive}) => _className('link-button', isActive && 'selected')}
				>
					Users
				</TS_NavLink>
			</LL_H_C>
			<Outlet/>
		</LL_V_L>;
	}
}


