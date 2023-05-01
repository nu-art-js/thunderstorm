import * as React from 'react';
import {
	ApiCallerEventTypeV2,
	BaseDB_ApiCallerV2,
	EditableDBItem,
	EventType_Create,
	EventType_Delete,
	EventType_Update,
	Props_SmartComponent,
	State_SmartComponent
} from '@nu-art/db-api-generator/frontend';
import {SimpleListAdapter, TS_DropDown, TS_PropRenderer} from '@nu-art/thunderstorm/frontend';
import {BadImplementationException, DB_Object} from '@nu-art/ts-common';
import {EditorBase, State_EditorBase} from './editor-base';
import {DB_PermissionUser} from '../shared';
import {ModuleFE_PermissionsUser, OnPermissionsUsersUpdated} from '../core/module-pack';

type State<T> = State_EditorBase<DB_PermissionUser> & {
	accounts: Readonly<T[]>
};

type Props<T extends DB_Object> = Props_SmartComponent & {
	accountsModule: BaseDB_ApiCallerV2<T>
	accountDisplayKey: keyof T;
}

export class PermissionUsersEditor<T extends DB_Object>
	extends EditorBase<DB_PermissionUser, State<T>, Props<T>>
	implements OnPermissionsUsersUpdated {

	//######################### Static #########################

	readonly module = ModuleFE_PermissionsUser;
	readonly itemName = 'Permission User';
	readonly itemNamePlural = 'Permission Users';
	readonly itemDisplay = (user: DB_PermissionUser) => this.getItemDisplay(user);
	static defaultProps = {
		modules: [ModuleFE_PermissionsUser]
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

	protected async deriveStateFromProps(nextProps: Props<T>, state: (State<T> & State_SmartComponent)) {
		state.items = ModuleFE_PermissionsUser.cache.all();
		state.accounts = nextProps.accountsModule.cache.all();
		return state;
	}

	//######################### Life Cycle #########################

	private getItemDisplay = (user: DB_PermissionUser): string => {
		const account = this.props.accountsModule.cache.unique(user.accountId);
		if (!account)
			throw new BadImplementationException(`No user with id ${user.accountId}`);
		return account[this.props.accountDisplayKey] as string;
	};

	//######################### Render #########################

	private renderAccountsDropdown = () => {
		const user = this.state.editedItem!;
		const accounts = this.state.accounts.filter(acc => !this.state.items.find(item => item.accountId === acc._id));
		const adapter = SimpleListAdapter(accounts, item => <div>{item.item[this.props.accountDisplayKey] as string}</div>);
		const selected = this.state.accounts.find(item => item._id === user.item.accountId);

		return <TS_PropRenderer.Vertical label={'Account'}>
			<TS_DropDown<T>
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