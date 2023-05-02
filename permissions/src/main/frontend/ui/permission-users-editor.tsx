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
import {SimpleListAdapter, TS_DropDown, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionUser} from '../shared';
import {ModuleFE_PermissionsUser, OnPermissionsUsersUpdated} from '../core/module-pack';
import {ModuleFE_Account} from '@nu-art/user-account/frontend';


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
		return state;
	}

	//######################### Life Cycle #########################

	//######################### Render #########################

	private renderAccountsDropdown = () => {
		const user = this.state.editedItem!;
		const accounts = this.state.items.filter(acc => !this.state.items.find(item => item.accountId === acc._id));
		const adapter = SimpleListAdapter(accounts, item => <>{this.props.renderAccount(item.item.accountId)}</>);
		const selected = accounts.find(item => item._id === user.item.accountId);

		return <TS_PropRenderer.Vertical label={'Account'}>
			<TS_DropDown<DB_PermissionUser>
				adapter={adapter}
				onSelected={value => this.setProperty('accountId', value._id)}
				selected={selected}
			/>
		</TS_PropRenderer.Vertical>;
	};

	editorContent = () => {
		return <>
			{this.renderAccountsDropdown()}
		</>;
	};
}