import * as React from 'react';
import {EditableDBItemV3, EventType_Create, EventType_Delete, EventType_Update, LL_H_C, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {MultiSelect} from '../ui-props';
import {DB_PermissionUser, DBProto_PermissionUser, DispatcherType_PermissionUser, ModuleFE_PermissionUser} from '../../_entity';
import {EditorBase, State_EditorBase} from './editor-base';
import {ApiCallerEventTypeV3, DispatcherInterface} from '@nu-art/thunderstorm/frontend/core/db-api-gen/v3_types';

type State = State_EditorBase<DBProto_PermissionUser>;

type Props = {
	renderAccount: (accountId: string) => string
}

export class PermissionUsersEditor
	extends EditorBase<DBProto_PermissionUser, State, Props>
	implements DispatcherInterface<DispatcherType_PermissionUser> {

	//######################### Static #########################

	readonly module = ModuleFE_PermissionUser;
	readonly itemName = 'Permission User';
	readonly itemNamePlural = 'Permission Users';
	readonly itemDisplay = (user: DB_PermissionUser) => this.props.renderAccount(user._id);
	static defaultProps = {
		renderAccount: (accountId: string) => ModuleFE_Account.getAccounts().find(account => account._id === accountId)?.email || 'Not Found'
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

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state.items = ModuleFE_PermissionUser.cache.all();
		if (!state.editedItem && state.items.length) {
			state.editedItem = new EditableDBItemV3(state.items[0], ModuleFE_PermissionUser);
			state.selectedItemId = state.items[0]._id;
		}
		return state;
	}

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