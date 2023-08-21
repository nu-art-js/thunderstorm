import * as React from 'react';
import {ReactNode} from 'react';
import {
	ApiCallerEventType,
	EditableDBItem,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	Props_SmartComponent,
	State_SmartComponent
} from '@nu-art/db-api-generator/frontend';
import {LL_H_C, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionUser} from '../shared';
import {ModuleFE_PermissionsUser, OnPermissionsUsersUpdated} from '../core/module-pack';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';
import {MultiSelect} from './ui-props';


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
		renderAccount: (accountId: string) =>
			<div>{ModuleFE_Account.getAccounts().find(account => account._id === accountId)?.email || 'Not Found'}</div>
	};

	//######################### Life Cycle #########################

	__onPermissionsUsersUpdated(...params: ApiCallerEventType<DB_PermissionUser>) {
		if ([EventType_Update, EventType_Create].includes(params[0])) {
			const level = params[1] as DB_PermissionUser;
			this.reDeriveState({
				selectedItemId: level._id,
				editedItem: new EditableDBItem<DB_PermissionUser>(level, ModuleFE_PermissionsUser).setAutoSave(true)
			});
		}
		if (params[0] === EventType_Delete)
			this.reDeriveState({selectedItemId: undefined, editedItem: undefined});
	}

	protected async deriveStateFromProps(nextProps: Props, state: (State & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsUser.cache.all();
		if (!state.editedItem && state.items.length) {
			state.editedItem = new EditableDBItem(state.items[0], ModuleFE_PermissionsUser);
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