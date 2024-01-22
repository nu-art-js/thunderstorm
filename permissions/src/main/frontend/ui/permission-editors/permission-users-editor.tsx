import * as React from 'react';
import {EditableDBItemV3, EventType_Create, EventType_Delete, EventType_Update, LL_H_C, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {MultiSelect} from '../ui-props';
import {DB_PermissionUser, DBProto_PermissionUser, DispatcherType_PermissionUser, ModuleFE_PermissionUser} from '../../_entity';
import {EditorBase, Props_EditorBase, State_EditorBase} from './editor-base';
import {ApiCallerEventTypeV3, DispatcherInterface} from '@nu-art/thunderstorm/frontend/core/db-api-gen/v3_types';

type State = State_EditorBase<DBProto_PermissionUser>;

type Props = Props_EditorBase<DBProto_PermissionUser> & {
	renderAccount: (accountId: string) => string
}

export class PermissionUsersEditor
	extends EditorBase<DBProto_PermissionUser, State, Props>
	implements DispatcherInterface<DispatcherType_PermissionUser> {

	//######################### Static #########################

	static defaultProps = {
		renderAccount: (accountId: string) => ModuleFE_Account.getAccounts().find(account => account._id === accountId)?.email || 'Not Found',
		module: ModuleFE_PermissionUser,
		itemName: 'Permission User',
		itemNamePlural: 'Permission Users',
		itemDisplay: (user: DB_PermissionUser) => this.defaultProps.renderAccount(user._id),
	};

	//######################### Life Cycle #########################

	__onPermissionUserUpdated(...params: ApiCallerEventTypeV3<DBProto_PermissionUser>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const level = params[1] as DB_PermissionUser;
			this.reDeriveState({
				selectedItemId: level._id,
				editedItem: new EditableDBItemV3(level, ModuleFE_PermissionUser).setAutoSave(true)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	};

	//######################### Render #########################

	editorContent = () => {
		return <TS_PropRenderer.Vertical label={'Groups'}>
			<LL_H_C className={'groups'}>
				<MultiSelect.Group
					editable={this.state.editedItem!}
					prop={'groups'}/>
			</LL_H_C>
		</TS_PropRenderer.Vertical>;
	};
}