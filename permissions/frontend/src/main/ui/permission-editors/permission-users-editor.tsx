import * as React from 'react';
import {ModuleFE_Account} from '@nu-art/user-account-frontend/index';
import {ModuleFE_PermissionUser} from '../../_entity.js';
import {Page_ItemsEditor} from '@nu-art/db-item-editor';
import {InferProps, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {TS_Route} from '@nu-art/thunder-routing';
import {MultiSelect} from '../ui-props.js';
import {Component_BasePermissionItemEditor} from './editor-base.js';
import {EditableRef, Props_EditableItemController, TS_EditableItemController} from '@nu-art/editable-item';
import {sortArray} from '@nu-art/ts-common';
import {DB_PermissionUser, DatabaseDef_PermissionUser} from '@nu-art/permissions-shared';


class Component_EditAccount
	extends Component_BasePermissionItemEditor<DatabaseDef_PermissionUser> {

	static defaultProps = {
		module: ModuleFE_PermissionUser,
		displayResolver: (item: DB_PermissionUser) => ModuleFE_Account.cache.unique(item._id)?.email ?? 'Not Found'
	};

	editorContent = () => {
		return <TS_PropRenderer.Vertical label={'Groups'}>
			<MultiSelect.Group
				className={'user-permission-groups'}
				editable={this.state.editable!}
				prop={'groups'}
			/>
		</TS_PropRenderer.Vertical>;
	};
}

class Controller_EditAccount
	extends TS_EditableItemController<DatabaseDef_PermissionUser> {
	static defaultProps = {
		module: ModuleFE_PermissionUser,
		editor: Component_EditAccount as React.ComponentType<EditableRef<DatabaseDef_PermissionUser['uiType']>>,
		createInitialInstance: () => ({}),
		autoSave: true
	};
}

export class PermissionUsersEditor
	extends Page_ItemsEditor<DatabaseDef_PermissionUser> {

	//######################### Static #########################

	static Route: TS_Route = {
		key: 'user-permission-editor',
		path: 'user-permission-editor',
		Component: this
	};

	protected renderHeader(): React.ReactNode {
		return <>User Permissions</>;
	}

	static defaultProps: Partial<InferProps<PermissionUsersEditor>> = {
		module: ModuleFE_PermissionUser,
		mapper: (user) => [ModuleFE_Account.cache.unique(user._id)?.email ?? 'Not Found'],
		sort: (items) => sortArray(items, (user) => ModuleFE_Account.cache.unique(user._id)?.email),
		itemRenderer: (user) => <>{ModuleFE_Account.cache.unique(user._id)?.email ?? 'Not Found'}</>,
		EditorRenderer: Controller_EditAccount as React.ComponentType<Partial<Props_EditableItemController<DatabaseDef_PermissionUser>>>,
		hideAddItem: true,
		route: PermissionUsersEditor.Route
	};
}
