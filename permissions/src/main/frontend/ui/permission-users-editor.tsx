import * as React from 'react';
import {ReactNode} from 'react';
import {
	ApiCallerEventTypeV2,
	EditableDBItem,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	Props_SmartComponent,
	State_SmartComponent
} from '@nu-art/db-api-generator/frontend';
import {LL_H_C, LL_V_L, SimpleListAdapter, TS_DropDown, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionGroup, DB_PermissionUser} from '../shared';
import {ModuleFE_PermissionsGroup, ModuleFE_PermissionsUser, OnPermissionsUsersUpdated} from '../core/module-pack';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {ThisShouldNotHappenException} from '@nu-art/ts-common';


type State = State_EditorBase<DB_PermissionUser>;

type Props = Props_SmartComponent & {
	renderAccount: (accountId: string) => ReactNode
}

export class PermissionUsersEditor
	extends EditorBase<DB_PermissionUser, State, Props>
	implements OnPermissionsUsersUpdated {

	//######################### Static #########################

	readonly module = ModuleFE_PermissionsUser;
	readonly itemName = 'Permission User';
	readonly itemNamePlural = 'Permission Users';
	readonly itemDisplay = (user: DB_PermissionUser) => this.props.renderAccount(user.accountId);
	static defaultProps = {
		modules: [ModuleFE_PermissionsUser],
		renderAccount: (accountId: string) => <div>{ModuleFE_Account.getAccounts().find(account => account._id === accountId)?.email || 'Not Found'}</div>
	};

	//######################### Life Cycle #########################

	__onPermissionsUsersUpdated(...params: ApiCallerEventTypeV2<DB_PermissionUser>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const level = params[1] as DB_PermissionUser;
			this.reDeriveState({
				selectedItemId: level._id,
				editedItem: new EditableDBItem<DB_PermissionUser>(level, ModuleFE_PermissionsUser)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	}

	protected async deriveStateFromProps(nextProps: Props, state: (State & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsUser.cache.all();
		if (!state.editedItem) {
			state.editedItem = new EditableDBItem(state.items[0], ModuleFE_PermissionsUser);
			state.selectedItemId = state.items[0]._id;
		}
		return state;
	}
	
	//######################### Render #########################

	private renderGroups = () => {
		const user = this.state.editedItem;
		if (!user || !user.item.groups)
			return '';

		return user.item.groups.map(group => {
			const _group = ModuleFE_PermissionsGroup.cache.unique(group.groupId);
			if (!_group)
				throw new ThisShouldNotHappenException(`Group with invalid groupId ${group.groupId}`);

			return <LL_V_L className={'group'} key={group.groupId}>
				<div className={'group__label'}>{_group.label}</div>
			</LL_V_L>;
		});
	};

	private renderAddGroup = () => {
		const user = this.state.editedItem;
		if (!user)
			return '';

		const groupIds = user.item.groups?.map(i => i.groupId) || [];
		const groups = ModuleFE_PermissionsGroup.cache.filter(i => !groupIds.includes(i._id));
		const adapter = SimpleListAdapter(groups, i => <div>{i.item.label}</div>);

		return <TS_DropDown<DB_PermissionGroup>
			adapter={adapter}
			selected={undefined}
			placeholder={'Select Group'}
			onSelected={item => {
				const groups = user.item.groups || [];
				groups.push({groupId: item._id, customField: {}});
				this.setProperty('groups', groups);
			}}
		/>;
	};

	editorContent = () => {
		return <TS_PropRenderer.Vertical label={'Groups'}>
			<LL_H_C className={'groups'}>
				{this.renderGroups()}
				{this.renderAddGroup()}
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	};
}